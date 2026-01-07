# backend\utils\file_utils.py

import base64
from pathlib import Path

def encode_file_to_base64(file_path: str) -> str:
    """
    Encode a file to a base64 string (UTF-8 safe for JSON responses).
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "rb") as f:
        encoded_bytes = base64.b64encode(f.read())
    return encoded_bytes.decode("utf-8")  # Ensure string, not bytes
