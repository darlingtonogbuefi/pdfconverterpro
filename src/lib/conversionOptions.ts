// src/lib/conversionOptions.ts

import type { ConversionType } from '@/types/converter';

export interface ConversionOption {
  id: ConversionType;
  label: string;
  inputFormats: string[];
  outputFormat: string;
  outputOptions?: (string | { label: string; angle?: number })[]; 
  available?: boolean;
  description?: string;
  usePopup?: boolean; // indicates if this conversion uses a popup workflow
}

export const conversionOptions: ConversionOption[] = [

  {
    id: 'pdf-to-word',
    label: 'PDF to Word',
    description: 'Convert PDF documents to editable Word files.',
    inputFormats: ['PDF'],
    outputFormat: 'Word',
  },
  {
    id: 'pdf-watermark',
    label: 'Watermark PDF',
    description: 'Apply a watermark to your PDF document.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true, // opens popup for watermarking
  },
  {
    id: 'pdf-edit',
    label: 'Edit PDF',
    description: 'Edit or delete text in PDF documents directly in the browser.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true, // opens editor popup for PDF text editing
  },
  {
    id: 'pdf-to-powerpoint',
    label: 'PDF to PPT',
    description: 'Convert PDF documents into editable PowerPoint slides.',
    inputFormats: ['PDF'],
    outputFormat: 'PowerPoint',
  },
  {
    id: 'pdf-sign',
    label: 'Sign PDF',
    description: 'Add a digital signature to a PDF.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true, // opens popup for signing
  },
  {
    id: 'pdf-compress',
    label: 'Compress PDF',
    description: 'Reduce the size of PDF files.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },
  {
    id: 'image-to-pdf',
    label: 'Image to PDF',
    description: 'Convert image files into a single PDF document.',
    inputFormats: ['png', 'jpg', 'jpeg'],
    outputFormat: 'PDF',
  },
  {
    id: 'pdf-stamp',
    label: 'Stamp PDF',
    description: 'Apply a stamp (like "Approved", "Confidential") to your PDF document.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    usePopup: true, // triggers a popup for stamp details
  },
  {
    id: 'pdf-merge',
    label: 'Merge PDFs',
    description: 'Combine multiple PDF files into one.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },
  {
    id: 'pdf-to-image',
    label: 'PDF to Images',
    description: 'Extract each page of a PDF as an image.',
    inputFormats: ['PDF'],
    outputFormat: 'JPG',
    outputOptions: [
      { label: 'JPG' },
      { label: 'PNG' },
    ],
  },
  {
    id: 'pdf-to-excel',
    label: 'PDF to Excel',
    description: 'Convert PDF tables into Excel spreadsheets.',
    inputFormats: ['pdf'],
    outputFormat: 'Excel',
  },
  {
    id: 'pdf-split',
    label: 'Split PDF',
    description: 'Split a PDF into multiple smaller PDF files.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
  },
  {
    id: 'image-to-word',
    label: 'Image to Word',
    description: 'Convert images with text into editable Word documents.',
    inputFormats: ['png', 'jpg', 'jpeg'],
    outputFormat: 'Word',
  },
  {
    id: 'image-to-excel',
    label: 'Image to Excel',
    description: 'Extract tables from images into Excel spreadsheets.',
    inputFormats: ['png', 'jpg', 'jpeg'],
    outputFormat: 'Excel',
  },
  {
    id: 'pdf-rotate',
    label: 'Rotate PDF',
    description: 'Rotate pages of a PDF document.',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    outputOptions: [
      { label: 'Rotate Right 90°', angle: 90 },
      { label: 'Rotate Left 90°', angle: 270 },
      { label: 'Rotate 180°', angle: 180 },
    ],
  },
  {
    id: 'word-to-excel',
    label: 'Word to Excel',
    description: 'Convert Word tables into Excel spreadsheets.',
    inputFormats: ['doc', 'docx'],
    outputFormat: 'Excel',
  },

  // <-- NEW: PDF Edit
  
];
