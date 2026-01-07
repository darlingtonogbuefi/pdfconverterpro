# backend/services/pdf-edit.py

import fitz  # PyMuPDF
from typing import List

def get_pdf_text(file_path: str):
    """
    Extract text and coordinates from PDF.
    Returns a list of pages, each containing text blocks with bbox, font, and size.
    """
    doc = fitz.open(file_path)
    pages = []

    for page_num, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        page_blocks = []

        for b in blocks:
            if "lines" in b:
                for line in b["lines"]:
                    for span in line["spans"]:
                        page_blocks.append({
                            "text": span["text"],
                            "bbox": span["bbox"],
                            "font": span.get("font", "helv"),
                            "size": span.get("size", 12)
                        })
        pages.append(page_blocks)
    return pages


def update_pdf_text(
    file_path: str,
    updates: List[dict],
    output_path: str,
):
    """
    updates = [
        {
            "page": 0,
            "bbox": [x0, y0, x1, y1],  # area to insert text
            "text": "Hello world\nThis is multi-line",
            "font": "helv",  # optional
            "size": 12       # optional
        },
    ]
    """
    doc = fitz.open(file_path)

    for u in updates:
        page = doc[u["page"]]
        rect = fitz.Rect(u["bbox"])
        font = u.get("font", "helv")
        size = u.get("size", 12)

        # Optional: delete old text in bbox
        # page.add_redact_annot(rect, fill=(1,1,1))
        # page.apply_redactions()

        # Insert text into a box with automatic wrapping
        page.insert_textbox(
            rect,
            u["text"],
            fontname=font,
            fontsize=size,
            color=(0, 0, 0),
            align=0  # left-aligned
        )

    doc.save(output_path)
    return output_path
