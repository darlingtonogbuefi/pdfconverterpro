# backend/services/pdf_sign.py

import base64
import io
import os
import tempfile
from copy import copy

from PyPDF2 import PdfReader, PdfWriter, Transformation
from reportlab.pdfgen import canvas
from PIL import Image


def png_to_pdf(png_bytes: bytes, output_path: str | None = None) -> str:
    if output_path is None:
        tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        output_path = tmp_pdf.name
        tmp_pdf.close()

    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    c = canvas.Canvas(output_path, pagesize=(img.width, img.height))
    c.drawInlineImage(img, 0, 0, width=img.width, height=img.height)
    c.showPage()
    c.save()

    print(f"[DEBUG] PNG converted to PDF at {output_path}")
    return output_path


def overlay_pdf(
    base_pdf: str,
    overlay_pdf_path: str,
    out_path: str,
    page: int = 0,
    x: int = 0,
    y: int = 0,
    width: int | None = None,
    height: int | None = None,
):
    reader = PdfReader(base_pdf)
    overlay_reader = PdfReader(overlay_pdf_path)
    overlay_page = overlay_reader.pages[0]
    writer = PdfWriter()

    for i, base_page in enumerate(reader.pages):
        if page == -1 or i == page:
            base_height = float(base_page.mediabox.height)
            overlay_width = float(overlay_page.mediabox.width)
            overlay_height = float(overlay_page.mediabox.height)

            scale_x = (width / overlay_width) if width else 1
            scale_y = (height / overlay_height) if height else 1
            final_height = height if height else overlay_height * scale_y
            flipped_y = base_height - y - final_height

            transformation = Transformation().scale(scale_x, scale_y).translate(x, flipped_y)
            overlay_copy = copy(overlay_page)
            overlay_copy.add_transformation(transformation)
            base_copy = copy(base_page)
            base_copy.merge_page(overlay_copy)
            writer.add_page(base_copy)
        else:
            writer.add_page(base_page)

    with open(out_path, "wb") as f:
        writer.write(f)

    print(f"[DEBUG] Overlay applied. Output saved at {out_path}")


def sign_pdf(
    pdf_path: str,
    image_base64: str,
    out_path: str,
    page: int = 0,
    x: int = 50,
    y: int = 50,
    width: int = 100,
    height: int = 50,
):
    page = max(0, page - 1)
    _, encoded = image_base64.split(",", 1) if "," in image_base64 else (None, image_base64)
    signature_bytes = base64.b64decode(encoded)
    tmp_overlay = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp_overlay.close()
    overlay_pdf_path = png_to_pdf(signature_bytes, tmp_overlay.name)

    overlay_pdf(
        base_pdf=pdf_path,
        overlay_pdf_path=overlay_pdf_path,
        out_path=out_path,
        page=page,
        x=x,
        y=y,
        width=width,
        height=height,
    )

    os.remove(overlay_pdf_path)
    print(f"[DEBUG] Signed PDF saved at {out_path}")
