// src/types/converter.ts

export type ConversionType = 
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'image-to-word'
  | 'image-to-excel'
  | 'word-to-excel'
  | 'pdf-to-powerpoint'
  | 'pdf-split'
  | 'pdf-merge'
  | 'pdf-compress'
  | 'pdf-watermark'
  | 'pdf-rotate'
  | 'pdf-sign'
  | 'pdf-stamp'
  | 'pdf-edit';  // <-- NEW: Added 'pdf-stamp' as a conversion type

export interface ConversionOption {
  id: ConversionType;
  label: string;
  description: string;
  inputFormats: string[];
  outputFormat: string;
  icon: string;
  available: boolean;
  outputOptions?: string[]; // optional formats for selection
}

export interface ConvertedFile {
  name: string;
  url: string;
  blob: Blob;
  original_filename?: string; // optional, if you want to track input file
}

// ✅ Updated ConversionStatus to include splitting and compressing
export type ConversionStatus =
  | 'idle'
  | 'uploading'
  | 'converting'
  | 'splitting'
  | 'compressing'
  | 'complete'
  | 'error';
