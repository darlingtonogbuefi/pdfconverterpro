// Backend API configuration
// Update this URL to point to your FastAPI backend
//  src\config\api.ts


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
  pdfSplit: '/api/convert/pdf-split',
  pdfMerge: '/api/convert/pdf-merge',
  pdfCompress: '/api/convert/pdf-compress',
  pdfWatermark: '/api/convert/pdf-watermark',
  pdfRotate: '/api/convert/pdf-rotate',
  pdfSign: '/api/convert/pdf-sign',
  pdfToPpt: '/api/convert/pdf-to-powerpoint',        // ✅ Added
  wordToExcel: '/api/convert/word-to-excel',  // ✅ Added
}

};

// ✅ Add this type export at the end
export type ConversionEndpoint = keyof typeof API_CONFIG.endpoints;
