import srt
import datetime
import uuid
import os
from typing import List

class SubtitleService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)
        
    def generate_srt(self, segments: List[dict]) -> str:
        """Generate SRT file content from STT segments."""
        subtitles = []
        for i, seg in enumerate(segments, start=1):
            start = datetime.timedelta(seconds=seg.get("start", 0))
            end = datetime.timedelta(seconds=seg.get("end", seg.get("start", 0) + 3))
            text = seg.get("text", "")
            subtitles.append(srt.Subtitle(index=i, start=start, end=end, content=text))
        return srt.compose(subtitles)
        
    def generate_vtt(self, segments: List[dict]) -> str:
        """Generate VTT file content."""
        srt_content = self.generate_srt(segments)
        # Hacky but standard way to convert basic SRT to VTT
        vtt_content = "WEBVTT\n\n" + srt_content.replace(',', '.')
        return vtt_content
        
    def save_subtitles(self, segments: List[dict]) -> tuple[str, str]:
        """Save both SRT and VTT formats and return their paths."""
        srt_content = self.generate_srt(segments)
        vtt_content = self.generate_vtt(segments)
        
        base_name = f"subtitles_{uuid.uuid4().hex[:8]}"
        srt_path = os.path.join(self.upload_dir, f"{base_name}.srt")
        vtt_path = os.path.join(self.upload_dir, f"{base_name}.vtt")
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
            
        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)
            
        return srt_path, vtt_path
