import cv2
import os
import numpy as np
from PIL import Image
from typing import List
from app.services.providers.ocr_base import OCRRegion
from app.core.logging import logger

# ──────────────────────────────────────────────────────────────────────────────
# Font resolution order.  Bundled Noto fonts (downloaded to backend/fonts/)
# are checked first — they cover Gujarati, Hindi, Latin, Arabic, etc.
# Falls back to common system fonts when the bundled ones are absent.
# ──────────────────────────────────────────────────────────────────────────────
_FONT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "fonts")
)

FONT_CANDIDATES = [
    # Bundled Noto fonts (downloaded during setup)
    os.path.join(_FONT_DIR, "NotoSansGujarati-Regular.ttf"),
    os.path.join(_FONT_DIR, "NotoSans-Regular.ttf"),
    # Windows system fonts with broad Unicode coverage
    "C:/Windows/Fonts/seguisym.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    # Linux / Docker paths
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def _resolve_font_path():
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            logger.info(f"Image renderer using font: {path}")
            return path
    logger.warning("No Unicode-capable font found; text rendering may be broken.")
    return None


_RESOLVED_FONT_PATH = _resolve_font_path()


class ImageProcessor:
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def remove_text_from_image(
        image: Image.Image, regions: List[OCRRegion], padding: int = 2
    ) -> Image.Image:
        """
        Creates a mask from detected OCR regions and uses OpenCV inpainting
        to erase original text while preserving the background.
        """
        if not regions:
            return image.copy()

        try:
            cv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            mask = np.zeros(cv_img.shape[:2], dtype=np.uint8)

            for region in regions:
                x = max(0, region.left - padding)
                y = max(0, region.top - padding)
                w = min(cv_img.shape[1] - x, region.width + padding * 2)
                h = min(cv_img.shape[0] - y, region.height + padding * 2)
                if w > 0 and h > 0:
                    cv2.rectangle(mask, (x, y), (x + w, y + h), 255, -1)

            inpainted = cv2.inpaint(cv_img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            return Image.fromarray(cv2.cvtColor(inpainted, cv2.COLOR_BGR2RGB))

        except Exception as e:
            logger.error(f"Image text removal failed: {e}")
            return image.copy()

    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def _get_font(size: int, text: str = ""):
        from PIL import ImageFont
        
        gujarati_font_path = None
        regular_font_path = None
        
        for path in FONT_CANDIDATES:
            if os.path.exists(path):
                if "Gujarati" in path:
                    gujarati_font_path = path
                elif "NotoSans-Regular" in path or "arial" in path.lower():
                    regular_font_path = path

        # Check if text contains Gujarati characters
        has_gujarati = any(0x0A80 <= ord(c) <= 0x0AFF for c in text) if text else False
        
        target_path = gujarati_font_path if has_gujarati and gujarati_font_path else regular_font_path
        
        if not target_path:
            # Fallback to whatever exists
            target_path = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)

        if target_path:
            try:
                return ImageFont.truetype(target_path, size)
            except Exception:
                pass
        return ImageFont.load_default()

    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def draw_translated_text(
        image: Image.Image,
        regions: List[OCRRegion],
        translated_texts: List[str],
    ) -> Image.Image:
        """
        Draws translated text inside the original OCR bounding boxes.

        Safely handles count mismatches between regions and texts by zipping
        (shortest list wins), so a single missing region never blanks the image.
        Automatically picks white or black fill based on the background brightness.
        """
        import textwrap
        from PIL import ImageDraw

        if not regions or not translated_texts:
            return image.copy()

        result_img = image.copy()
        draw = ImageDraw.Draw(result_img)

        # zip stops at the shorter list — safe even when counts differ
        for region, trans_text in zip(regions, translated_texts):
            if not trans_text or not trans_text.strip():
                continue

            box_w = max(1, region.width)
            box_h = max(1, region.height)

            min_size = 8
            max_size = max(min_size, int(box_h * 0.85))

            best_font = ImageProcessor._get_font(min_size, trans_text)
            best_wrapped = trans_text

            # Find the largest font that still fits inside the bounding box
            for size in range(max_size, min_size - 1, -1):
                font = ImageProcessor._get_font(size, trans_text)

                try:
                    char_w = max(font.getlength("A"), 1)
                except Exception:
                    char_w = size * 0.55

                chars_per_line = max(1, int(box_w / char_w))
                wrapped = textwrap.fill(trans_text, width=chars_per_line)

                try:
                    bbox = draw.multiline_textbbox((0, 0), wrapped, font=font)
                    text_w = bbox[2] - bbox[0]
                    text_h = bbox[3] - bbox[1]
                except Exception:
                    text_w, text_h = box_w + 1, box_h + 1

                if text_w <= box_w and text_h <= box_h:
                    best_font = font
                    best_wrapped = wrapped
                    break
            else:
                # Use minimum size with tightest wrap
                font = ImageProcessor._get_font(min_size, trans_text)
                try:
                    char_w = max(font.getlength("A"), 1)
                except Exception:
                    char_w = min_size * 0.55
                chars_per_line = max(1, int(box_w / char_w))
                best_wrapped = textwrap.fill(trans_text, width=chars_per_line)
                best_font = font

            # Auto text colour: white on dark bg, black on light bg
            try:
                region_crop = result_img.crop((
                    region.left, region.top,
                    region.left + region.width,
                    region.top + region.height,
                ))
                avg_brightness = np.array(region_crop).mean()
                fill_color = (255, 255, 255) if avg_brightness < 128 else (0, 0, 0)
            except Exception:
                fill_color = (0, 0, 0)

            draw.multiline_text(
                (region.left, region.top),
                best_wrapped,
                font=best_font,
                fill=fill_color,
                spacing=2,
            )

        return result_img
