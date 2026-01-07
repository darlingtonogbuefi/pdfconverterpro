# backend/services/pdf_overlay.py

from PyPDF2 import PdfReader, PdfWriter

def overlay_pdf(
    base_pdf: str,
    overlay_pdf_path: str,
    out_path: str,
    page: int = 0,
    x: int = 0,
    y: int = 0,
):
    """
    Overlay a PDF onto another PDF.
    """
    reader = PdfReader(base_pdf)
    overlay_reader = PdfReader(overlay_pdf_path)

    if not overlay_reader.pages:
        raise ValueError("Overlay PDF has no pages")

    overlay_page = overlay_reader.pages[0]
    writer = PdfWriter()

    for i, p in enumerate(reader.pages):
        if page == -1 or i == page:
            p.merge_transformed_page(
                overlay_page,
                [1, 0, 0, 1, x, y]
            )
        writer.add_page(p)

    with open(out_path, "wb") as f:
        writer.write(f)
