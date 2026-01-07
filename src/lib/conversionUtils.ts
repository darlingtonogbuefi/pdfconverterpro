// src/lib/conversionUtils.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ConvertedFile } from '@/types/converter';

export const handleDownload = (file: ConvertedFile) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleDownloadAll = async (convertedFiles: ConvertedFile[]) => {
  if (convertedFiles.length === 0) {
    console.error('No files to download');
    return;
  }

  if (convertedFiles.length === 1) {
    handleDownload(convertedFiles[0]);
    return;
  }

  const zip = new JSZip();

  await Promise.all(
    convertedFiles.map(async (file, idx) => {
      try {
        const blob = await fetch(file.url).then(res => res.blob());

        const originalName = file.name ?? 'file';
        const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
        const baseName = originalName.replace(/\.[^/.]+$/, ''); // remove extension
        const fileName = `Page ${idx + 1} - ${baseName}${extension ? '.' + extension : ''}`;

        zip.file(fileName, blob);
      } catch (err) {
        console.error('Failed to fetch file for ZIP:', file.name, err);
      }
    })
  );

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'converted_files.zip');
};

export const handleReset = (
  setSelectedFiles: (files: File[]) => void,
  setConvertedFiles: (files: ConvertedFile[]) => void,
  onReset?: () => void
) => {
  setSelectedFiles([]);
  setConvertedFiles([]);
  onReset?.();
  console.log('Conversion reset');
};
