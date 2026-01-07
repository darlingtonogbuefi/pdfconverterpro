import requests
from pathlib import Path
import base64

# Replace with your FastAPI URL
URL = "http://127.0.0.1:8000/api/convert/pdf-compress"

# List of files to test
FILES_TO_TEST = [
    r"C:\Users\MAGNUM\OneDrive\Desktop\test convertion\01.CISSP_(ISC)²_Official_Study_Guide（最新第七版）_en (1).pdf",
    r"C:\Users\MAGNUM\OneDrive\Desktop\test convertion\cissp_test online.pdf"
]

# Compression methods to test
METHODS = ["pypdf2", "pikepdf", "gs", "all"]

for file_path in FILES_TO_TEST:
    print(f"\nTesting file: {file_path}\n{'-'*50}")
    for method in METHODS:
        with open(file_path, "rb") as f:
            files = {"file": f}
            params = {"method": method}
            response = requests.post(URL, files=files, params=params)
            data = response.json()
            if data.get("success"):
                file_size = len(base64.b64decode(data["file"]))
                print(f"Method: {method:7} | Compressed size: {file_size/1024:.2f} KB")
            else:
                print(f"Method: {method:7} | Error: {data.get('error')}")
