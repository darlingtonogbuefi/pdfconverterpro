// src/components/pdf-watermark/PdfViewer.tsx


// src/components/pdf-watermark/PdfViewer.tsx

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

type PdfViewerProps = {
  url: string;
  fileName: string;
};

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ url, fileName }: PdfViewerProps) {
  const isMobile =
    typeof window !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const [numPages, setNumPages] = useState<number>(0);
  const [pdfError, setPdfError] = useState(false);

  const onDocumentLoadSuccess = (doc: { numPages: number }) => {
    setNumPages(doc.numPages);
  };

  return (
    <div
      className="
        flex-1
        w-full
        overflow-auto
        bg-gray-50
        relative
        min-h-[calc(100vh-2.5rem)]
        sm:min-h-0
      "
    >
      {isMobile ? (
        pdfError ? (
          // Mobile fallback: Google Docs Viewer
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              url
            )}&embedded=true`}
            className="w-full h-full border"
            title="PDF Viewer Fallback"
          />
        ) : (
          // Mobile default: react-pdf rendering all pages
          <div className="flex flex-col items-center space-y-4 py-4 overflow-y-auto">
            <Document
              file={url}
              onLoadError={(error) => {
                console.error('PDF.js failed to load PDF:', error);
                setPdfError(true);
              }}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                  <div className="text-center space-y-2">
                    <p className="font-medium">{fileName}</p>
                    <p>Loading PDF preview...</p>
                  </div>
                </div>
              }
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={360} // You can adjust width based on screen
                  className="shadow-sm bg-white"
                />
              ))}
            </Document>
          </div>
        )
      ) : (
        // Desktop PDF preview
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full border"
          title="PDF Viewer"
          style={{ filter: 'blur(0px)' }}
        />
      )}
    </div>
  );
}
