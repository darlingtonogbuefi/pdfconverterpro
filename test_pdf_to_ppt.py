# test_pdf_to_ppt.py

from backend.services.pdf_to_powerpoint import convert_pdf_to_ppt
import base64
import os

# Input PDF (make sure this exists)
input_pdf = "test.pdf"

# Output PPTX (can be just a filename; directory creation is handled safely)
output_ppt = "test_output.pptx"

# Call the conversion function
result = convert_pdf_to_ppt(
    pdf_path=input_pdf,
    out_path=output_ppt,
    original_name="test.pdf",
    enable_ocr=False,    # Disable OCR for a simple test
    default_font="Arial"
)

print("Conversion Success:", result["success"])
print("Generated Filename:", result["filename"])

# Decode the base64 output and save as PPTX to verify
decoded_path = "decoded_test_output.pptx"
with open(decoded_path, "wb") as f:
    f.write(base64.b64decode(result["file"]))

print(f"PPTX saved to: {decoded_path}")

# Extra: ensure output directory exists (safe even if you change output path)
output_dir = os.path.dirname(output_ppt)
if output_dir and not os.path.exists(output_dir):
    os.makedirs(output_dir)
