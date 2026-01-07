import os
from backend.utils.pdf_utils import render_pdf_images
from backend.utils.file_utils import encode_file_to_base64

def convert_pdf_to_images(pdf_path: str, tmp: str):
    images = []
    for i, img in enumerate(render_pdf_images(pdf_path)):
        path = os.path.join(tmp, f"page_{i+1}.png")
        img.convert("RGB").save(path, "PNG")
        images.append(encode_file_to_base64(path))
    return images
