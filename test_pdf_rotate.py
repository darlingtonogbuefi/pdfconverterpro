from backend.services.pdf_rotate import rotate_pdf
from pathlib import Path

# Path to a sample PDF (replace with your own test PDF)
input_pdf = Path("sample.pdf")

# Output directory
output_dir = Path("test_outputs")
output_dir.mkdir(exist_ok=True)

# Angles to test
angles = [90, 180, 270]

for angle in angles:
    output_pdf = output_dir / f"rotated_{angle}.pdf"
    rotate_pdf(str(input_pdf), str(output_pdf), angle)
    print(f"Rotated {angle}° -> {output_pdf}")
