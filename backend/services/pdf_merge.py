from PyPDF2 import PdfMerger

def merge_pdfs(pdf_paths: list[str], out_path: str):
    merger = PdfMerger()
    for path in pdf_paths:
        merger.append(path)
    merger.write(out_path)
    merger.close()
