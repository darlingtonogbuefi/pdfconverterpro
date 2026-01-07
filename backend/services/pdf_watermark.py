#  backend\services\pdf_watermark.py

import pypdf
from tempfile import NamedTemporaryFile
from typing import Union
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

from backend.schemas.pdf_watermark import (
    GridOptions,
    InsertOptions,
    TextWatermark,
    ImageWatermark,
)
from backend.utils.watermark_utils import draw_watermarks
from backend.utils.pdf_utils import convert_content_to_images


def add_watermark_to_pdf(
    input_pdf: str,
    output_pdf: str,
    watermark: Union[TextWatermark, ImageWatermark],
    placement: Union[GridOptions, InsertOptions],
    image_path: str | None = None,
):
    reader = pypdf.PdfReader(input_pdf)
    writer = pypdf.PdfWriter()

    page_sizes = [(p.mediabox.width, p.mediabox.height) for p in reader.pages]
    processed = {}

    for index, page in enumerate(reader.pages):
        size = page_sizes[index]

        if size not in processed:
            with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                c = canvas.Canvas(tmp.name, pagesize=size)

                if watermark.type == "text":
                    c.setFont(watermark.font, watermark.font_size)
                    c.setFillColor(
                        HexColor(watermark.color),
                        alpha=watermark.opacity,
                    )
                else:
                    c.setFillAlpha(watermark.opacity)
                    c.setStrokeAlpha(watermark.opacity)

                draw_watermarks(
                    canvas=c,
                    width=size[0],
                    height=size[1],
                    watermark=watermark,
                    placement=placement,
                    image=image_path,
                )

                c.save()

                if watermark.save_as_image:
                    convert_content_to_images(tmp.name, watermark.dpi)

                processed[size] = pypdf.PdfReader(tmp.name)

        page.merge_page(processed[size].pages[0])
        writer.add_page(page)

    with open(output_pdf, "wb") as f:
        writer.write(f)
