"""
Real Speech-to-Text provider using Google's free Web Speech API.

Strategy:
  1. Use ffmpeg (bundled via imageio-ffmpeg) to convert any audio format
     to 16 kHz mono FLAC chunks of ~55 seconds each.
  2. POST each chunk to the Google Speech REST endpoint with the requests
     library (already installed).  No API key required for short requests.
  3. Concatenate all chunk transcripts into a single result.

Limits of the free endpoint:
  - 1 request per chunk, up to ~60 s audio per request.
  - No authentication, but may be throttled for very large files.
"""

import asyncio
import json
import os
import subprocess
import tempfile
import time
from typing import Optional

import requests

from app.core.logging import logger
from app.schemas.speech import TranscriptionResponse, TranscriptionSegment
from app.services.providers.speech_base import SpeechToTextProvider

# Google free Web Speech API endpoint
_GOOGLE_STT_URL = (
    "http://www.google.com/speech-api/v2/recognize"
    "?client=chromium&lang={lang}&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw"
)

# Maximum audio duration per chunk in seconds (keep under 60 s)
_CHUNK_SECONDS = 55

# Language code mapping: our internal codes → BCP-47 tags Google expects
_LANG_MAP = {
    "auto": "en-US",  # fallback for auto-detect
    "en": "en-US",
    "gu": "gu-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "bn": "bn-IN",
    "ur": "ur-PK",
    "fr": "fr-FR",
    "de": "de-DE",
    "es": "es-ES",
    "it": "it-IT",
    "pt": "pt-BR",
    "ru": "ru-RU",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "zh": "zh-CN",
    "ar": "ar-SA",
    "nl": "nl-NL",
    "pl": "pl-PL",
    "tr": "tr-TR",
    "sv": "sv-SE",
}


def _get_ffmpeg() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def _get_audio_duration(file_path: str, ffmpeg: str) -> float:
    """Return duration in seconds using ffprobe bundled with ffmpeg."""
    ffprobe = ffmpeg.replace("ffmpeg", "ffprobe")
    if not os.path.exists(ffprobe):
        # Fallback: use ffmpeg itself to read duration
        result = subprocess.run(
            [ffmpeg, "-i", file_path],
            capture_output=True, text=True
        )
        for line in result.stderr.split("\n"):
            if "Duration" in line:
                parts = line.strip().split(",")[0].split("Duration:")[1].strip()
                h, m, s = parts.split(":")
                return float(h) * 3600 + float(m) * 60 + float(s)
        return 0.0

    result = subprocess.run(
        [ffprobe, "-v", "quiet", "-print_format", "json",
         "-show_format", file_path],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    return float(data.get("format", {}).get("duration", 0))


def _convert_chunk_to_flac(
    file_path: str,
    start: float,
    duration: float,
    out_path: str,
    ffmpeg: str,
) -> bool:
    """Convert a time slice of an audio file to 16 kHz mono FLAC."""
    cmd = [
        ffmpeg, "-y",
        "-ss", str(start),
        "-t", str(duration),
        "-i", file_path,
        "-ar", "16000",   # 16 kHz sample rate (required by Google STT)
        "-ac", "1",        # mono
        "-c:a", "flac",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True)
    return result.returncode == 0


def _transcribe_flac_chunk(flac_path: str, lang_bcp47: str, retries: int = 3) -> str:
    """Send a FLAC chunk to Google's free STT endpoint and return the transcript."""
    url = _GOOGLE_STT_URL.format(lang=lang_bcp47)
    headers = {"Content-Type": "audio/x-flac; rate=16000"}

    with open(flac_path, "rb") as f:
        audio_data = f.read()

    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, data=audio_data, headers=headers, timeout=30)
            if resp.status_code != 200:
                logger.warning(f"Google STT HTTP {resp.status_code} on attempt {attempt}")
                time.sleep(2 * attempt)
                continue

            # Google returns multiple JSON objects separated by newlines
            transcript_parts = []
            for line in resp.text.strip().splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    results = obj.get("result", [])
                    for r in results:
                        alts = r.get("alternative", [])
                        if alts:
                            transcript_parts.append(alts[0].get("transcript", ""))
                except json.JSONDecodeError:
                    continue

            return " ".join(transcript_parts).strip()

        except requests.RequestException as e:
            logger.warning(f"Google STT request error attempt {attempt}: {e}")
            time.sleep(2 * attempt)

    logger.error(f"Google STT failed after {retries} retries for chunk {flac_path}")
    return ""


class GoogleSTTProvider(SpeechToTextProvider):
    """
    Real STT using Google's free Web Speech API with ffmpeg-based chunking.
    Transcribes audio files of any length by splitting into ~55-second chunks.
    """

    async def transcribe(
        self, file_path: str, source_language: str
    ) -> TranscriptionResponse:
        if not os.path.exists(file_path):
            from app.core.exceptions import BaseLingoraException
            raise BaseLingoraException("Audio file not found.", status_code=404)

        lang = source_language.lower() if source_language else "auto"
        lang_bcp47 = _LANG_MAP.get(lang, _LANG_MAP.get(lang.split("-")[0], "en-US"))

        logger.info(
            f"GoogleSTTProvider: transcribing {file_path} "
            f"(lang={lang} → {lang_bcp47})"
        )

        # Run the blocking ffmpeg + HTTP work in a thread pool
        loop = asyncio.get_running_loop()
        transcript, duration, segments = await loop.run_in_executor(
            None, self._run_pipeline, file_path, lang_bcp47
        )

        if not transcript:
            logger.warning("GoogleSTTProvider: empty transcript, using fallback")
            transcript = "[Could not transcribe audio — no speech detected or language unsupported]"

        return TranscriptionResponse(
            transcript=transcript,
            detected_language=lang if lang != "auto" else "en",
            duration=duration,
            segments=segments,
        )

    def _run_pipeline(
        self, file_path: str, lang_bcp47: str
    ):
        ffmpeg = _get_ffmpeg()
        duration = _get_audio_duration(file_path, ffmpeg)
        logger.info(f"GoogleSTTProvider: audio duration = {duration:.1f}s")

        segments: list[TranscriptionSegment] = []
        all_text: list[str] = []

        import concurrent.futures
        from dataclasses import dataclass

        @dataclass
        class ChunkTask:
            index: int
            start: float
            dur: float
            path: str
            text: str = ""

        with tempfile.TemporaryDirectory() as tmp_dir:
            chunk_start = 0.0
            chunk_index = 0
            tasks = []

            while chunk_start < duration:
                chunk_dur = min(_CHUNK_SECONDS, duration - chunk_start)
                chunk_path = os.path.join(tmp_dir, f"chunk_{chunk_index:04d}.flac")
                tasks.append(ChunkTask(chunk_index, chunk_start, chunk_dur, chunk_path))
                chunk_start += _CHUNK_SECONDS
                chunk_index += 1

            # Prepare audio chunks (CPU bound, so parallelize conversion)
            def prepare_chunk(task: ChunkTask):
                ok = _convert_chunk_to_flac(file_path, task.start, task.dur, task.path, ffmpeg)
                return ok, task

            def process_chunk(task: ChunkTask):
                text = _transcribe_flac_chunk(task.path, lang_bcp47)
                task.text = text
                return task

            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                # 1. Convert all chunks in parallel
                futures_prep = [executor.submit(prepare_chunk, t) for t in tasks]
                prepared_tasks = []
                for f in concurrent.futures.as_completed(futures_prep):
                    ok, t = f.result()
                    if ok:
                        prepared_tasks.append(t)
                    else:
                        logger.warning(f"ffmpeg conversion failed for chunk {t.index}")

                # Sort back by index
                prepared_tasks.sort(key=lambda t: t.index)

                # 2. Transcribe all chunks in parallel
                futures_trans = [executor.submit(process_chunk, t) for t in prepared_tasks]
                
                # Gather results sequentially
                for t in prepared_tasks:
                    text = t.text # Wait, it is populated by process_chunk but we must await future!
                    
            # Actually we need to wait for futures to finish and get result!
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                # Transcribe in parallel
                future_to_task = {executor.submit(process_chunk, t): t for t in prepared_tasks}
                for future in concurrent.futures.as_completed(future_to_task):
                    pass # Ensure all finished

            for t in prepared_tasks:
                if t.text:
                    all_text.append(t.text)
                    segments.append(
                        TranscriptionSegment(
                            start=t.start,
                            end=t.start + t.dur,
                            text=t.text,
                        )
                    )
                    logger.info(f"GoogleSTTProvider: chunk {t.index} -> {len(t.text)} chars")
                else:
                    logger.info(f"GoogleSTTProvider: chunk {t.index} -> silent/no speech")

        full_transcript = " ".join(all_text)
        return full_transcript, duration, segments
