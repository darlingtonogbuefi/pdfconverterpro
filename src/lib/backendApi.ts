// src/lib/backendApi.ts

import type { ConvertedFile } from '@/types/converter';

interface BackendResponse {
  success: boolean;
  filename?: string;
  files?: string[];
  file?: string;
  images?: string[];
  ocr_text?: string;
  error?: string;
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Supported MIME types
 */
const mimeTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.txt': 'text/plain',
};

/**
 * Map endpoints to default output extensions
 */
const endpointExtensions: Record<string, string> = {
  imagesToPdf: '.pdf',
  pdfSplit: '.pdf',
  pdfToWord: '.docx',
  pdfToPpt: '.pptx',
  wordToExcel: '.xlsx',
  pdfToExcel: '.xlsx',
  wordToPdf: '.pdf',
  excelToPdf: '.pdf',
  pdfStamp: '.pdf',
  pdfEdit: '.pdf', // <-- NEW: PDF edit output
};

/**
 * Backend API configuration
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  endpoints: {
    health: '/health',
    pdfToWord: '/api/convert/pdf-to-word',
    wordToPdf: '/api/convert/word-to-pdf',
    pdfToExcel: '/api/convert/pdf-to-excel',
    excelToPdf: '/api/convert/excel-to-pdf',
    pdfToImages: '/api/convert/pdf-to-images',
    imagesToPdf: '/api/convert/images-to-pdf',
    imageToWord: '/api/convert/image-to-word',
    imageToExcel: '/api/convert/image-to-excel',
    wordToExcel: '/api/convert/word-to-excel',
    pdfSplit: '/api/convert/pdf-split',
    pdfMerge: '/api/convert/pdf-merge',
    pdfCompress: '/api/convert/pdf-compress',
    pdfWatermark: '/api/convert/pdf-watermark',
    pdfRotate: '/api/convert/pdf-rotate',
    pdfSign: '/api/convert/pdf-sign',
    pdfToPpt: '/api/convert/pdf-to-powerpoint',
    pdfStamp: '/api/convert/pdf-stamp',
    pdfEditExtract: '/pdf-edit/extract', // <-- NEW
    pdfEditUpdate: '/pdf-edit/update',   // <-- NEW
  }
};

export type ConversionEndpoint = keyof typeof API_CONFIG.endpoints;

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generic backend conversion handler
 */
export async function convertWithBackend(
  fileOrFiles: File | File[],
  endpoint: ConversionEndpoint,
  options: {
    ocr?: boolean;
    format?: string;
    start?: number;
    end?: number;
    select_pages?: string;
    compression_level?: string;
    recompress_images?: boolean;
    angle?: string;
    pdfName?: string;
  } = {},
  onProgress?: (progress: number) => void
): Promise<ConvertedFile | ConvertedFile[]> {

  const formData = new FormData();

  const singleFileEndpoints: ConversionEndpoint[] = [
    'pdfToImages', 'pdfToWord', 'wordToPdf', 'pdfRotate',
    'pdfSign', 'imageToWord', 'imageToExcel', 'pdfSplit',
    'pdfCompress', 'pdfToPpt', 'wordToExcel', 'pdfToExcel',
    'pdfStamp', 'pdfEditExtract', 'pdfEditUpdate', // <-- NEW
  ];

  const filesArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  if (singleFileEndpoints.includes(endpoint)) {
    formData.append('file', filesArray[0]);
  } else {
    filesArray.forEach(f => formData.append('files', f));
  }

  if (options.ocr) formData.append('ocr', 'true');
  if (options.format && endpoint !== 'pdfRotate') formData.append('format', options.format);
  if (endpoint === 'pdfRotate' && options.angle) formData.append('angle', options.angle);
  if (endpoint === 'imagesToPdf') {
    const pdfName = options.pdfName || `${filesArray[0].name.split('.')[0]}.pdf`;
    formData.append('pdf_name', pdfName);
  }
  if (endpoint === 'pdfSplit') {
    formData.append('start', String(options.start ?? 1));
    if (options.end) formData.append('end', String(options.end));
  }
  if (endpoint === 'pdfCompress') {
    formData.append('compression_level', options.compression_level ?? 'max');
    formData.append('recompress_images', String(options.recompress_images ?? true));
    formData.append('select_pages', options.select_pages ?? '');
  }

  onProgress?.(10);

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`,
    { method: 'POST', body: formData }
  );

  onProgress?.(70);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Conversion failed (${response.status})`);
  }

  const data: BackendResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Conversion failed');
  }

  onProgress?.(90);

  const results: ConvertedFile[] = [];
  const originalName = filesArray[0].name;

  // Files
  if (data.file || data.files?.length) {
    const base64Files = data.files ?? (data.file ? [data.file] : []);
    base64Files.forEach((base64File, idx) => {
      const ext = endpointExtensions[endpoint] || (options.format ? `.${options.format.toLowerCase()}` : '.bin');
      const blob = base64ToBlob(base64File, mimeTypes[ext] || 'application/octet-stream');
      const name = data.filename ? data.filename : originalName.replace(/\.[^/.]+$/, ext);
      results.push({ name, url: URL.createObjectURL(blob), blob });
    });
  }

  // Images
  if (data.images?.length) {
    data.images.forEach((img, idx) => {
      const ext = options.format ? `.${options.format.toLowerCase()}` : '.png';
      const blob = base64ToBlob(img, mimeTypes[ext] || 'image/png');
      results.push({ name: `${originalName.split('.')[0]}_page_${idx + 1}${ext}`, url: URL.createObjectURL(blob), blob });
    });
  }

  // OCR
  if (data.ocr_text) {
    const blob = base64ToBlob(data.ocr_text, 'text/plain');
    results.push({ name: `${originalName.split('.')[0]}_ocr.txt`, url: URL.createObjectURL(blob), blob });
  }

  if (!results.length) throw new Error('Backend returned no files');
  onProgress?.(100);
  return results.length === 1 ? results[0] : results;
}

/**
 * NEW: Upload a PDF to extract text blocks for editing
 */
export async function uploadFile(endpoint: '/pdf-edit/extract' | '/pdf-edit/update', file: File, updates?: any[]) {
  const formData = new FormData();
  formData.append('file', file);

  if (endpoint === '/pdf-edit/update' && updates) {
    formData.append('updates', JSON.stringify(updates));
  }

  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error(`PDF edit request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Shortcut for updating PDF text
 */
export async function updatePdfText(file: File, updates: any[]) {
  return uploadFile('/pdf-edit/update', file, updates);
}
