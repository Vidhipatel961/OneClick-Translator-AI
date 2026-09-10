import os
import uuid
import subprocess
import imageio_ffmpeg
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger

class VideoService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)
        self.ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
    def align_audio_duration(self, audio_path: str, target_duration: float) -> str:
        """
        Adjusts audio duration using FFmpeg's atempo filter to match the target subtitle duration.
        Safely limits extreme stretching to preserve voice quality.
        """
        import re
        
        # 1. Get current duration by parsing ffmpeg output
        cmd_info = [self.ffmpeg_exe, "-i", audio_path]
        result = subprocess.run(cmd_info, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        output = result.stderr
        
        duration_match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", output)
        if not duration_match:
            logger.warning("Could not determine audio duration for stretching. Returning original.")
            return audio_path
            
        hours, minutes, seconds = map(float, duration_match.groups())
        orig_dur = hours * 3600 + minutes * 60 + seconds
        
        if orig_dur <= 0 or target_duration <= 0:
            return audio_path
            
        logger.info(f"Audio Stretch: Original duration: {orig_dur:.2f}s, Target subtitle duration: {target_duration:.2f}s")
        
        # 2. Compare lengths and calculate ratio
        # If orig_dur > target_duration: ratio > 1.0 (Compress/Speed up)
        # If orig_dur < target_duration: ratio < 1.0 (Stretch/Slow down)
        ratio = orig_dur / target_duration
        
        # 3, 4, 7. Limit extreme stretching safely (between 0.7 and 1.5)
        clamped_ratio = max(0.7, min(1.5, ratio))
        
        final_expected_dur = orig_dur / clamped_ratio
        logger.info(f"Audio Stretch: Applied atempo={clamped_ratio:.2f}. Final expected duration: {final_expected_dur:.2f}s")
        
        if abs(clamped_ratio - 1.0) < 0.05:
            # Within 5%, don't bother stretching
            return audio_path
            
        output_path = audio_path.replace(".mp3", f"_aligned_{uuid.uuid4().hex[:4]}.mp3")
        
        # 5. Use FFmpeg atempo filter
        cmd = [
            self.ffmpeg_exe,
            "-y",
            "-i", audio_path,
            "-filter:a", f"atempo={clamped_ratio}",
            output_path
        ]
        
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg atempo stretch failed: {e.stderr.decode() if e.stderr else str(e)}")
            return audio_path

    def build_synchronized_audio_track(self, segments: list, tts_chunks: list, target_audio_path: str = None) -> str:
        """
        Mixes multiple audio chunks at specific timestamps, leaving silent gaps in between.
        If target_audio_path is provided, matches its exact duration by mixing a muted version.
        segments: list of dicts with 'start', 'duration'
        tts_chunks: list of file paths
        """
        if not tts_chunks:
            raise BaseLingoraException("No TTS chunks provided for synchronization.", status_code=500)
            
        final_output = os.path.join(self.upload_dir, f"final_sync_{uuid.uuid4().hex[:8]}.mp3")
        cmd = [self.ffmpeg_exe, "-y"]
        filter_complex = []
        
        input_count = 0
        if target_audio_path:
            cmd.extend(["-i", target_audio_path])
            # Completely mute original background audio per user request
            filter_complex.append("[0:a]volume=0.0[base];")
            input_count += 1
        
        for chunk in tts_chunks:
            cmd.extend(["-i", chunk])
            
        for i, seg in enumerate(segments):
            start_ms = int(seg["start"] * 1000)
            input_idx = input_count + i
            filter_complex.append(f"[{input_idx}:a]adelay={start_ms}|{start_ms}[a{i}];")
            
        mix_inputs = "".join([f"[a{i}]" for i in range(len(segments))])
        if target_audio_path:
            mix_inputs = "[base]" + mix_inputs
            total_inputs = len(segments) + 1
        else:
            total_inputs = len(segments)
            
        filter_complex.append(f"{mix_inputs}amix=inputs={total_inputs}:dropout_transition=0:normalize=0[outa]")
        
        cmd.extend(["-filter_complex", "".join(filter_complex)])
        cmd.extend(["-map", "[outa]"])
        cmd.append(final_output)
        
        logger.info(f"Building synchronized audio track with {len(tts_chunks)} chunks.")
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return final_output
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg build sync audio failed: {e.stderr.decode() if e.stderr else str(e)}")
            raise BaseLingoraException("Failed to generate synchronized audio track.", status_code=500)

    def extract_audio(self, video_path: str) -> str:
        """Extract audio from video file and return path to the extracted audio."""
        try:
            audio_path = os.path.join(self.upload_dir, f"extracted_{uuid.uuid4().hex[:8]}.mp3")
            logger.info(f"Extracting audio from {video_path} to {audio_path}")
            
            cmd = [
                self.ffmpeg_exe,
                "-y",  # overwrite output
                "-i", video_path,
                "-acodec", "libmp3lame",
                "-q:a", "4",
                audio_path
            ]
            
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return audio_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg extract audio error: {e.stderr.decode() if e.stderr else str(e)}")
            raise BaseLingoraException("Failed to extract audio from video.", status_code=500)
            
    def extract_voice_sample(self, audio_path: str, segments: list) -> str | None:
        """
        Extracts a clean speaker sample from the original audio using STT timestamps.
        Finds the longest contiguous speech segment (ideally 10-60 seconds) to use for cloning.
        """
        if not segments or not os.path.exists(audio_path):
            return None
            
        # Find the longest segment
        longest_seg = max(segments, key=lambda s: float(s.get("end", 0)) - float(s.get("start", 0)))
        start_time = float(longest_seg.get("start", 0))
        end_time = float(longest_seg.get("end", 0))
        duration = end_time - start_time
        
        # If the longest segment is less than 5 seconds, it's not a great sample, but we'll try
        # Limit the sample to max 60 seconds to save bandwidth and meet provider limits
        if duration > 60.0:
            duration = 60.0
            
        sample_path = os.path.join(self.upload_dir, f"sample_{uuid.uuid4().hex[:8]}.mp3")
        
        logger.info(f"Extracting voice sample from {start_time:.2f}s for {duration:.2f}s")
        
        cmd = [
            self.ffmpeg_exe,
            "-y",
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", audio_path,
            "-acodec", "libmp3lame",
            "-q:a", "2",
            sample_path
        ]
        
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            # Validate generated file
            if not os.path.exists(sample_path) or os.path.getsize(sample_path) < 1024:
                logger.warning("Voice sample extraction resulted in invalid/empty file.")
                if os.path.exists(sample_path):
                    os.remove(sample_path)
                return None
            return sample_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg sample extraction error: {e.stderr.decode() if e.stderr else str(e)}")
            return None
            
    def render_video_with_audio_and_subs(self, video_path: str, audio_path: str, srt_path: str) -> str:
        """Replace original audio with new audio and optionally hardcode subtitles."""
        try:
            output_path = os.path.join(self.upload_dir, f"translated_{uuid.uuid4().hex[:8]}.mp4")
            logger.info(f"Rendering final video {output_path}")
            
            # Mux new audio with the video. (Do not embed SRT, use external VTT instead)
            cmd = [
                self.ffmpeg_exe,
                "-y",
                "-i", video_path,
                "-i", audio_path,
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v:0",
                "-map", "1:a:0",
                output_path
            ]
            
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg render video error: {e.stderr.decode() if e.stderr else str(e)}")
            raise BaseLingoraException("Failed to render final video.", status_code=500)
