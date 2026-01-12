// src/lib/pdfjs.ts

import { GlobalWorkerOptions } from 'pdfjs-dist';

// Required for PDF.js to work in browsers
GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
