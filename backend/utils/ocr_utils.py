# backend\utils\ocr_utils.py


# backend/utils/ocr_utils.py

import pytesseract
from pytesseract import Output
from PIL import Image

def ocr_image(image: Image.Image) -> str:
    """
    Extracts text from an image using Tesseract OCR.
    """
    return pytesseract.image_to_string(image)

def ocr_image_with_data(image: Image.Image):
    """
    Returns OCR data with bounding boxes. Useful for table detection or layout parsing.
    """
    return pytesseract.image_to_data(image, output_type=Output.DICT)

def CFL(s: str) -> str:
    """
    Custom function to manipulate strings (example: strip and convert to uppercase).
    """
    return s.strip().upper()

