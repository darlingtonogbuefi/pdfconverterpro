# backend\utils\watermark_utils.py

from typing import Union
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw, ImageFont
import io
from reportlab.lib import colors
import warnings
import os

from backend.schemas.pdf_watermark import (
    GridOptions,
    InsertOptions,
    TextWatermark,
    ImageWatermark,
)


def draw_watermarks(
    canvas: Canvas,
    width: float,
    height: float,
    watermark: Union[TextWatermark, ImageWatermark],
    placement: Union[GridOptions, InsertOptions],
    image: str | None,
    opacity: float = 0.4,
):
    """
    Draw watermarks on the canvas with optional opacity.
    opacity: 0.0 (transparent) to 1.0 (fully visible)
    """
    if isinstance(placement, InsertOptions):
        x = placement.x * width
        y = placement.y * height

        _draw_single(
            canvas=canvas,
            x=x,
            y=y,
            watermark=watermark,
            image=image,
            rotate=False,
            cell_width=width,
            cell_height=height,
            opacity=opacity,
        )
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

                _draw_single(
                    canvas=canvas,
                    x=x,
                    y=y,
                    watermark=watermark,
                    image=image,
                    rotate=(placement.tile_type == "diagonal"),
                    cell_width=step_x,
                    cell_height=step_y,
                    opacity=opacity,
                )


def _draw_single(
    canvas: Canvas,
    x: float,
    y: float,
    watermark: Union[TextWatermark, ImageWatermark],
    image: str | None,
    rotate: bool,
    cell_width: float,
    cell_height: float,
    opacity: float = 0.4,
):
    canvas.saveState()
    canvas.translate(x, y)

    if rotate:
        canvas.rotate(getattr(watermark, "angle", 0))

    if watermark.type == "text":
        # Render text as an RGBA image to support opacity
        font_name = getattr(watermark, "font_name", "arial.ttf")
        font_size = getattr(watermark, "font_size", 20)
        text_color = getattr(watermark, "color", "black")

        # Convert color to RGB tuple
        try:
            if isinstance(text_color, str):
                c = colors.toColor(text_color)
                r, g, b = int(c.red * 255), int(c.green * 255), int(c.blue * 255)
            else:
                r, g, b = int(text_color.red * 255), int(text_color.green * 255), int(text_color.blue * 255)
        except Exception:
            r, g, b = 0, 0, 0

        # Darken default color if it's black or None
        if text_color in (None, "black"):
            factor = 0.15  # 0 = black, 1 = original
            r = int(r * factor)
            g = int(g * factor)
            b = int(b * factor)

        # Attempt to load font, fallback if not found
        try:
            if os.path.isfile(font_name):
                font = ImageFont.truetype(font_name, font_size)
            else:
                # Try system fonts
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
        except OSError:
            warnings.warn(f"Cannot open font '{font_name}', using default PIL font.")
            font = ImageFont.load_default()

        # Get bounding box
        bbox = font.getbbox(watermark.text)  # returns (x0, y0, x1, y1)
        x0, y0, x1, y1 = bbox
        text_width = x1 - x0
        text_height = y1 - y0

        # Create image with full text including baseline offset
        img = Image.new("RGBA", (text_width, text_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Ensure minimum alpha for visibility
        alpha = int(255 * max(opacity, 0.5))
        draw.text((-x0, -y0), watermark.text, font=font, fill=(r, g, b, alpha))

        # Convert to ReportLab Image
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)
        rl_img = ImageReader(img_byte_arr)

        # Scale to cell if needed
        max_w = cell_width * 0.8
        max_h = cell_height * 0.8
        scale_w = max_w / text_width
        scale_h = max_h / text_height
        scale = min(scale_w, scale_h, 1.0)
        draw_w = text_width * scale
        draw_h = text_height * scale

        # Draw centered
        canvas.drawImage(rl_img, -draw_w / 2, -draw_h / 2, width=draw_w, height=draw_h, mask="auto")

    elif watermark.type == "image" and image:
        # Open image and apply opacity
        pil_img = Image.open(image).convert("RGBA")
        alpha = pil_img.split()[3].point(lambda p: int(p * opacity))
        pil_img.putalpha(alpha)

        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)
        rl_img = ImageReader(img_byte_arr)

        iw, ih = pil_img.size
        max_iw = cell_width * 0.8
        max_ih = cell_height * 0.8
        scale_w = max_iw / iw
        scale_h = max_ih / ih
        scale = min(scale_w, scale_h, getattr(watermark, "image_scale", 1.0))
        iw *= scale
        ih *= scale

        canvas.drawImage(rl_img, -iw / 2, -ih / 2, width=iw, height=ih, mask="auto")

    canvas.restoreState()
