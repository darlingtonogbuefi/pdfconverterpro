#backend\services\image_to_word.py

from PIL import Image
import pytesseract
from docx import Document
import cv2
import numpy as np

def preprocess_image(pil_image: Image.Image) -> np.ndarray:
    img_cv = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2GRAY)
    img_cv = cv2.medianBlur(img_cv, 3)
    _, img_cv = cv2.threshold(img_cv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return img_cv

def image_to_word(image_path: str, output_path: str) -> None:
    pil_image = Image.open(image_path).convert("RGB")
    img_cv = preprocess_image(pil_image)

    text = pytesseract.image_to_string(img_cv)

    doc = Document()
    for line in text.split("\n"):
        if line.strip():
            doc.add_paragraph(line)
    doc.save(output_path)
