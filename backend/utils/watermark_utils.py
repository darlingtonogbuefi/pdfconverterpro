# backend\utils\watermark_utils.py

from typing import Union
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw, ImageFont
import io
from reportlab.lib import colors
import os

from backend.schemas.pdf_watermark import (
    GridOptions,
    InsertOptions,
    TextWatermark,
    ImageWatermark,
)

# Common Linux font fallbacks (no new dependency required)
FONT_FALLBACKS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]

def _load_font_safe(font_name: str, font_size: int) -> ImageFont.FreeTypeFont:
    """Safely load a font for PIL text rendering."""
    if font_name and os.path.isfile(font_name):
        try:
            return ImageFont.truetype(font_name, font_size)
        except OSError:
            pass

    for path in FONT_FALLBACKS:
        if os.path.isfile(path):
            try:
                return ImageFont.truetype(path, font_size)
            except OSError:
                continue

    return ImageFont.load_default()


def draw_watermarks(
    canvas: Canvas,
    width: float,
    height: float,
    watermark: Union[TextWatermark, ImageWatermark],
    placement: Union[GridOptions, InsertOptions],
    image: str | None,
    opacity: float = 0.2,
):
    """Draw watermarks on the canvas with optional opacity."""
    if isinstance(placement, InsertOptions):
        x = placement.x * width
        y = placement.y * height
        _draw_single(canvas, x, y, watermark, image, False, width, height, opacity)
        return

    if isinstance(placement, GridOptions):
        step_x = width / placement.horizontal_boxes
        step_y = height / placement.vertical_boxes

        for col in range(placement.horizontal_boxes):
            for row in range(placement.vertical_boxes):
                x = (col + 0.5) * step_x
                y = (row + 0.5) * step_y
                if placement.tile_type == "diagonal":
                    y += (col % 2) * (step_y / 2)

                _draw_single(canvas, x, y, watermark, image,
                             rotate=(placement.tile_type == "diagonal"),
                             cell_width=step_x, cell_height=step_y,
                             opacity=opacity)


def _draw_single(
    canvas: Canvas,
    x: float,
    y: float,
    watermark: Union[TextWatermark, ImageWatermark],
    image: str | None,
    rotate: bool,
    cell_width: float,
    cell_height: float,
    opacity: float = 0.2,
):
    canvas.saveState()
    canvas.translate(x, y)

    if rotate:
        canvas.rotate(getattr(watermark, "angle", 0))

    # -----------------------
    # TEXT WATERMARK
    # -----------------------
    if watermark.type == "text":
        font_name = getattr(watermark, "font_name", None)
        font_size = getattr(watermark, "font_size", 20)
        text_color = getattr(watermark, "color", "black")

        # Convert color to RGB
        try:
            c = colors.toColor(text_color)
            r, g, b = int(c.red * 255), int(c.green * 255), int(c.blue * 255)
        except Exception:
            r, g, b = 0, 0, 0

        # Supersampling for sharpness
        scale_factor = 4
        font = _load_font_safe(font_name, font_size * scale_factor)

        bbox = font.getbbox(watermark.text)
        x0, y0, x1, y1 = bbox
        text_width = max(1, x1 - x0)
        text_height = max(1, y1 - y0)

        # Create high-res RGBA image
        img = Image.new("RGBA", (text_width, text_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw text with proper alpha
        alpha = max(int(255 * opacity), 50)  # minimum alpha to ensure visibility
        draw.text((-x0, -y0), watermark.text, font=font, fill=(r, g, b, alpha))

        # Downscale for smooth text
        target_width = int(text_width / scale_factor)
        target_height = int(text_height / scale_factor)
        img = img.resize((target_width, target_height), Image.LANCZOS)

        # Convert to ReportLab image
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        rl_img = ImageReader(buffer)

        # Scale to fit cell
        max_w = cell_width * 0.8
        max_h = cell_height * 0.8
        scale = min(max_w / target_width, max_h / target_height, 1.0)

        draw_w = target_width * scale
        draw_h = target_height * scale

        canvas.drawImage(
            rl_img,
            -draw_w / 2,
            -draw_h / 2,
            width=draw_w,
            height=draw_h,
            mask="auto"
        )

    # -----------------------
    # IMAGE WATERMARK
    # -----------------------
    elif watermark.type == "image" and image:
        pil_img = Image.open(image).convert("RGBA")
        alpha = pil_img.split()[3].point(lambda p: int(p * opacity))
        pil_img.putalpha(alpha)

        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        buffer.seek(0)
        rl_img = ImageReader(buffer)

        iw, ih = pil_img.size
        max_iw = cell_width * 0.8
        max_ih = cell_height * 0.8

        scale = min(
            max_iw / iw,
            max_ih / ih,
            getattr(watermark, "image_scale", 1.0),
        )

        iw *= scale
        ih *= scale

        canvas.drawImage(
            rl_img,
            -iw / 2,
            -ih / 2,
            width=iw,
            height=ih,
            mask="auto"
        )

    canvas.restoreState()
