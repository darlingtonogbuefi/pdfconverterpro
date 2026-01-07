# backend/utils/pdf_utils.py

import fitz
from pdf2image import convert_from_path
from backend.core.config import POPPLER_PATH
from typing import List
from PIL import Image
from io import BytesIO
import pypdf
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def is_scanned_pdf(pdf_path: str, min_chars: int = 20, max_pages: int = 3) -> bool:
    """
    Determines if the PDF is a scanned document by checking for text content.
    """
    doc = fitz.open(pdf_path)
    text_len = 0

    try:
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            text_len += len(page.get_text().strip())
            if text_len >= min_chars:
                return False
        return True
    finally:
        doc.close()


def render_pdf_images(
    pdf_path: str,
    dpi: int = 300,
    first_page: int | None = None,
    last_page: int | None = None,
) -> List[Image.Image]:
    """
    Converts PDF to images using the pdf2image library.
    """
    return convert_from_path(
        pdf_path,
        poppler_path=POPPLER_PATH,
        dpi=dpi,
        fmt="png",
        use_pdftocairo=True,
        first_page=first_page,
        last_page=last_page,
    )


def extract_format_text(pdf_path: str) -> str:
    """
    Placeholder function to demonstrate extracting and formatting text from a PDF.
    """
    # In a real case, this could use libraries like PyMuPDF (fitz) or pdfminer.
    return "Extracted text from PDF"


def convert_content_to_images(file_name: str, dpi: int):
    """
    Converts each PDF page to an image and re-embeds it back into the PDF.
    Useful for making watermarks unselectable or saving PDF pages as images.
    """
    try:
        images = convert_from_path(
            file_name,
            poppler_path=POPPLER_PATH,
            dpi=dpi,
            fmt="png",
            transparent=True,
        )
    except Exception:
        # Poppler not installed or error → silently skip
        return

    reader = pypdf.PdfReader(file_name)
    page_sizes = [
        (page.mediabox.width, page.mediabox.height)
        for page in reader.pages
    ]

    pdf = canvas.Canvas(file_name)

    for image, (page_width, page_height) in zip(images, page_sizes):
        pdf.setPageSize((page_width, page_height))

        buffer = BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        buffer.seek(0)

        pdf.drawImage(
            ImageReader(buffer),
            0,
            0,
            width=page_width,
            height=page_height,
            mask="auto",
        )
        pdf.showPage()

    pdf.save()
