#  backend\services\pdf_rotate.py

from pathlib import Path
from PyPDF2 import PdfReader, PdfWriter

def rotate_pdf(input_path: str, output_path: str, angle: int = 90) -> str:
    """
    Rotate all pages of a PDF by a specified angle.

    Args:
        input_path (str): Path to the input PDF.
        output_path (str): Path to save the rotated PDF.
        angle (int): Rotation angle (90, 180, 270 degrees).

    Returns:
        str: Path to the rotated PDF.
    """
    if angle not in (90, 180, 270):
        raise ValueError("Rotation angle must be 90, 180, or 270 degrees")

    input_path = Path(input_path)
    output_path = Path(output_path)

    reader = PdfReader(str(input_path))
    writer = PdfWriter()

    for page in reader.pages:
        # Rotate page
        page.rotate(angle)
        writer.add_page(page)

    # Save rotated PDF
    with open(output_path, "wb") as f_out:
        writer.write(f_out)

    return str(output_path)
