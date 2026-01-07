//  src\components\PDFMergeUploader.tsx

import { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { Button } from '@/components/ui/button';
import { convertWithBackend } from '@/lib/backendApi';

export function PDFMergeUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedFileUrl, setMergedFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setMergedFileUrl(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMergedFileUrl(null);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least 1 PDF file.');
      return;
    }

    try {
      setLoading(true);

      // ✅ use canonical conversion id
      const result = await convertWithBackend(selectedFiles, 'pdfMerge');

      const mergedFile = Array.isArray(result) ? result[0] : result;
      setMergedFileUrl(mergedFile.url);
    } catch (err) {
      console.error(err);
      alert('Error uploading files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        acceptedFormats={['.pdf']}
        onFilesSelected={handleFilesSelected}
        selectedFiles={selectedFiles}
        onRemoveFile={handleRemoveFile}
        maxFiles={10}
      />

      <div className="flex items-center gap-4">
        <Button
          onClick={uploadFiles}
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? 'Merging...' : 'Merge PDFs'}
        </Button>

        {mergedFileUrl && (
          <a
            href={mergedFileUrl}
            download="merged.pdf"
            className="text-primary font-medium hover:underline"
          >
            Download Merged PDF
          </a>
        )}
      </div>
    </div>
  );
}
