from docx import Document
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from pathlib import Path

from backend.utils.file_utils import encode_file_to_base64

def convert_word_to_pdf(docx_path: str, pdf_path: str, original_name: str):
    doc = Document(docx_path)
    c = canvas.Canvas(pdf_path, pagesize=letter)
    y = letter[1] - inch

    for p in doc.paragraphs:
        if p.text.strip():
            c.drawString(inch, y, p.text)
            y -= 14
            if y < inch:
                c.showPage()
                y = letter[1] - inch

    c.save()

    return {
        "success": True,
        "filename": Path(original_name).stem + ".pdf",
        "file": encode_file_to_base64(pdf_path)
    }
