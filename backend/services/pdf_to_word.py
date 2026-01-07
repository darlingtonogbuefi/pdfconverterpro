# backend\services\pdf_to_word.py

from pathlib import Path
from pdf2docx import Converter
from docx import Document
import pytesseract
from backend.utils.pdf_utils import is_scanned_pdf, render_pdf_images
from backend.utils.file_utils import encode_file_to_base64

def convert_pdf_to_word(pdf_path: str, out_path: str, original_name: str):
    scanned = is_scanned_pdf(pdf_path)

    if not scanned:
        cv = Converter(pdf_path)
        cv.convert(out_path)
        cv.close()
    else:
        doc = Document()
        for img in render_pdf_images(pdf_path):
            doc.add_paragraph(pytesseract.image_to_string(img))
        doc.save(out_path)

    return {
        "success": True,
        "filename": Path(original_name).stem + (".docx" if not scanned else "_ocr.docx"),
        "file": encode_file_to_base64(out_path)
    }
