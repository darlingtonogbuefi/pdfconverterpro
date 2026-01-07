# backend\services\images_to_pdf.py

from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from backend.utils.file_utils import encode_file_to_base64

def convert_images_to_pdf(image_paths, pdf_path):
    """
    Convert a list of images to a PDF.
    Images are scaled to fit the page while maintaining aspect ratio and centered.
    Returns the PDF as a base64-encoded string.
    """
    c = canvas.Canvas(pdf_path, pagesize=letter)
    page_width, page_height = letter

    for path in image_paths:
        img = Image.open(path).convert("RGB")

        # Maximum usable width and height
        max_width = page_width - 2 * inch
        max_height = page_height - 2 * inch
        img_ratio = img.width / img.height
        page_ratio = max_width / max_height

        if img_ratio > page_ratio:
            # Image is wider relative to page
            width = max_width
            height = width / img_ratio
        else:
            # Image is taller relative to page
            height = max_height
            width = height * img_ratio

        # Center the image
        x = (page_width - width) / 2
        y = (page_height - height) / 2

        c.drawInlineImage(img, x, y, width, height)
        c.showPage()

    c.save()
    return encode_file_to_base64(pdf_path)
