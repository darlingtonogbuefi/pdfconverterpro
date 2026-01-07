# backend/services/image_to_excel.py

from PIL import Image
import pytesseract
from openpyxl import Workbook
import cv2
import numpy as np
from collections import defaultdict

def preprocess_image(pil_image: Image.Image) -> np.ndarray:
    """Grayscale, denoise, threshold, and shadow removal for robust OCR."""
    img_cv = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2GRAY)
    # Remove shadows
    dilated = cv2.dilate(img_cv, np.ones((7, 7), np.uint8))
    bg = cv2.medianBlur(dilated, 21)
    img_no_shadow = 255 - cv2.absdiff(img_cv, bg)
    # Denoise and threshold
    img_cv = cv2.medianBlur(img_no_shadow, 3)
    _, img_cv = cv2.threshold(img_cv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return img_cv

def cluster_positions(positions, threshold=10):
    """Cluster nearby positions into single positions (rows or columns)."""
    positions = sorted(positions)
    clusters = []
    for pos in positions:
        if not clusters or pos - clusters[-1][-1] > threshold:
            clusters.append([pos])
        else:
            clusters[-1].append(pos)
    return [int(np.mean(c)) for c in clusters]

def image_to_excel(image_path: str, output_path: str) -> None:
    """Convert image to Excel with robust table detection."""
    pil_image = Image.open(image_path).convert("RGB")
    img_cv = preprocess_image(pil_image)

    # OCR with bounding box info
    data = pytesseract.image_to_data(img_cv, output_type=pytesseract.Output.DICT)

    # Collect positions for clustering
    tops, lefts = [], []
    for i, text in enumerate(data['text']):
        if text.strip():
            tops.append(data['top'][i])
            lefts.append(data['left'][i])

    row_positions = cluster_positions(tops)
    col_positions = cluster_positions(lefts)

    # Map text to table cells
    table = defaultdict(lambda: defaultdict(str))
    for i, text in enumerate(data['text']):
        if not text.strip():
            continue
        top = data['top'][i]
        left = data['left'][i]

        row_idx = min(range(len(row_positions)), key=lambda r: abs(row_positions[r]-top))
        col_idx = min(range(len(col_positions)), key=lambda c: abs(col_positions[c]-left))

        if table[row_idx][col_idx]:
            table[row_idx][col_idx] += " " + text
        else:
            table[row_idx][col_idx] = text

    # Write to Excel
    wb = Workbook()
    ws = wb.active
    for r in sorted(table.keys()):
        for c in sorted(table[r].keys()):
            ws.cell(row=r+1, column=c+1, value=table[r][c])
    wb.save(output_path)
