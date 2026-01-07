# backend/services/pdf_split.py

from pathlib import Path
from typing import List, Tuple
from PyPDF2 import PdfReader, PdfWriter
from fpdf import FPDF
import pytesseract

from backend.utils.pdf_utils import is_scanned_pdf, render_pdf_images
from backend.utils.file_utils import encode_file_to_base64

# Path to a TTF font that supports UTF-8
UTF8_FONT_PATH = Path(__file__).parent.parent / "assets/fonts/DejaVuSans.ttf"


def split_pdf(pdf_path: str, out_dir: str, start: int = 1, end: int | None = None) -> Tuple[List[str], int]:
    """
    Split a PDF into individual pages.
    Handles both normal and scanned PDFs.

    Args:
        pdf_path (str): Path to the input PDF.
        out_dir (str): Directory to save split pages.
        start (int, optional): Start page number (1-indexed). Defaults to 1.
        end (int | None, optional): End page number. Defaults to last page.

    Returns:
        Tuple[List[str], int]: List of file paths of split pages, total pages in PDF.
    """
    pdf_path = Path(pdf_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    scanned = is_scanned_pdf(pdf_path)

    # Read PDF
    reader = PdfReader(str(pdf_path))
    total_pages = len(reader.pages)
    end = end or total_pages

    if start < 1 or end > total_pages or start > end:
        raise ValueError(f"Invalid start/end: start={start}, end={end}, total={total_pages}")

    split_files: List[str] = []

    if not scanned:
        # Standard PDF: split normally
        for i in range(start - 1, end):
            writer = PdfWriter()
            writer.add_page(reader.pages[i])
            out_file = out_dir / f"{pdf_path.stem}_page_{i+1}.pdf"
            with open(out_file, "wb") as f:
                writer.write(f)
            split_files.append(str(out_file))
    else:
        # Scanned PDF: convert each page to PDF with OCR text
        for i, img in enumerate(render_pdf_images(pdf_path), start=1):
            if i < start or i > end:
                continue
            pdf = FPDF()
            pdf.add_page()
            pdf.set_auto_page_break(auto=True, margin=15)

            # Use UTF-8 font if available
            if UTF8_FONT_PATH.exists():
                pdf.add_font("DejaVu", "", str(UTF8_FONT_PATH), uni=True)
                pdf.set_font("DejaVu", size=12)
            else:
                # Fallback: core font (may fail for non-latin chars)
                pdf.set_font("Helvetica", size=12)

            text = pytesseract.image_to_string(img)

            try:
                pdf.multi_cell(0, 10, text)
            except Exception:
                # Fallback: replace unsupported characters
                safe_text = text.encode("latin-1", "replace").decode("latin-1")
                pdf.multi_cell(0, 10, safe_text)

            out_file = out_dir / f"{pdf_path.stem}_page_{i}_ocr.pdf"
            pdf.output(str(out_file))
            split_files.append(str(out_file))

    return split_files, total_pages


def split_pdf_base64(pdf_path: str, out_dir: str, start: int = 1, end: int | None = None):
    """
    Split PDF and return files encoded in Base64.

    Returns:
        dict: {
            "success": True,
            "total_pages": int,
            "returned_pages": int,
            "files": List[str]
        }
    """
    pages, total = split_pdf(pdf_path, out_dir, start, end)
    encoded_files = [encode_file_to_base64(p) for p in pages]

    return {
        "success": True,
        "total_pages": total,
        "returned_pages": len(encoded_files),
        "files": encoded_files
    }
