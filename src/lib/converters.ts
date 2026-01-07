// src/lib/converters.ts


import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import type { ConvertedFile } from '@/types/converter';
import { API_CONFIG } from './backendApi';

// Convert a Base64 string to a Blob with correct MIME type
function base64ToBlob(base64: string, filename?: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  let type = 'application/pdf';
  if (filename) {
    if (filename.endsWith('.pptx')) {
      type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (filename.endsWith('.xlsx')) {
      type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (filename.endsWith('.docx')) {
      type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }

  return new Blob([new Uint8Array(byteNumbers)], { type });
}

// Send FormData to backend and return a ConvertedFile (used for base64 responses)
async function postFormData(url: string, formData: FormData): Promise<ConvertedFile> {
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Conversion failed');

  const data = await res.json();
  let filename = data.filename || 'converted-file';

  if (!filename.toLowerCase().endsWith('.pptx') && url.includes('pdfToPpt')) {
    filename += '.pptx';
  }

  const blob = base64ToBlob(data.file, filename);

  return {
    name: filename,
    url: URL.createObjectURL(blob),
    blob,
  };
}

// ----------------------
// Frontend conversions
// ----------------------

export async function imageToPdf(files: File[]): Promise<ConvertedFile> {
  const pdf = new jsPDF();

  for (let i = 0; i < files.length; i++) {
    const imageUrl = await fileToDataUrl(files[i]);
    if (i > 0) pdf.addPage();

    const img = await loadImage(imageUrl);
    const imgWidth = pdf.internal.pageSize.getWidth() - 20;
    const imgHeight = (img.height * imgWidth) / img.width;

    const pageHeight = pdf.internal.pageSize.getHeight() - 20;
    const finalHeight = Math.min(imgHeight, pageHeight);
    const finalWidth =
      imgHeight > pageHeight
        ? (img.width * finalHeight) / img.height
        : imgWidth;

    pdf.addImage(imageUrl, 'JPEG', 10, 10, finalWidth, finalHeight);
  }

  const blob = pdf.output('blob');
  return { name: 'converted.pdf', url: URL.createObjectURL(blob), blob };
}

export async function pdfToImages(file: File): Promise<ConvertedFile[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  const results: ConvertedFile[] = [];

  for (let i = 0; i < pages.length; i++) {
    const { width, height } = pages[i].getSize();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#333333';
      ctx.font = '20px Arial';
      ctx.fillText(`Page ${i + 1}`, 20, 40);
      ctx.fillText(`Size: ${Math.round(width)} x ${Math.round(height)}`, 20, 70);
      ctx.fillText('Full rendering requires backend service', 20, 100);
    }

    const blob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png')
    );

    results.push({
      name: `page-${i + 1}.png`,
      url: URL.createObjectURL(blob),
      blob,
    });
  }

  return results;
}

// ----------------------
// Backend PDF operations
// ----------------------

export async function pdfRotate(file: File, angle = 90): Promise<ConvertedFile> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('angle', String(angle));
  return postFormData(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfRotate}`, fd);
}

export async function pdfWatermark(
  file: File,
  payload: { watermark: any; placement: any; imageFile?: File }
): Promise<ConvertedFile> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('payload', JSON.stringify({
    watermark: payload.watermark,
    placement: payload.placement,
  }));

  if (payload.imageFile) fd.append('image', payload.imageFile);

  const res = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfWatermark}`,
    { method: 'POST', body: fd }
  );

  if (!res.ok) throw new Error('Watermark failed');

  const blob = await res.blob();
  return { name: 'watermarked.pdf', url: URL.createObjectURL(blob), blob };
}

export async function pdfStamp(
  file: File,
  stamp: { text: string; page?: number; x?: number; y?: number; fontSize?: number; color?: string }
): Promise<ConvertedFile> {
  if (!stamp.text) throw new Error('Stamp text is required');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('text', stamp.text);
  fd.append('page', String(stamp.page ?? 0));
  fd.append('x', String(stamp.x ?? 100));
  fd.append('y', String(stamp.y ?? 100));
  fd.append('fontSize', String(stamp.fontSize ?? 30));
  fd.append('color', stamp.color ?? 'black');

  return postFormData(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfStamp}`, fd);
}

export async function pdfSign(
  file: File,
  signature: { imageBase64: string; page?: number; x?: number; y?: number; width?: number; height?: number; date: string }
): Promise<ConvertedFile> {
  if (!signature.imageBase64) throw new Error('Signature imageBase64 is required');
  if (!signature.date) throw new Error('Date is required');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('imageBase64', signature.imageBase64);
  fd.append('page', String(signature.page ?? 0));
  fd.append('x', String(signature.x ?? 0));
  fd.append('y', String(signature.y ?? 0));
  fd.append('width', String(signature.width ?? 150));
  fd.append('height', String(signature.height ?? 50));
  fd.append('date', signature.date);

  return postFormData(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfSign}`, fd);
}

// ----------------------
// PDF Edit (FIXED)
// ----------------------

export async function pdfExtractText(file: File): Promise<any> {
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfEditExtract}`,
    { method: 'POST', body: fd }
  );

  if (!res.ok) throw new Error('Failed to extract PDF text');
  return res.json();
}

export async function pdfEdit(file: File, updates: any[]): Promise<ConvertedFile> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('updates', JSON.stringify(updates));

  const res = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfEditUpdate}`,
    { method: 'POST', body: fd }
  );

  if (!res.ok) throw new Error('Failed to update PDF');

  const data = await res.json();
  const blob = await fetch(data.file_path).then(r => r.blob());

  return {
    name: 'pdf-edit.pdf',
    url: URL.createObjectURL(blob),
    blob,
  };
}

// ----------------------
// Helper functions
// ----------------------

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ----------------------
// Backend conversions
// ----------------------

export async function wordToExcel(file: File): Promise<ConvertedFile> {
  const fd = new FormData();
  fd.append('file', file);
  return postFormData(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.wordToExcel}`, fd);
}

export async function pdfToPpt(file: File): Promise<ConvertedFile> {
  const fd = new FormData();
  fd.append('file', file);
  return postFormData(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pdfToPpt}`, fd);
}
