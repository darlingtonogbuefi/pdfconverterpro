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
  const [currentPage, setCurrentPage] = useState(1); // optional for mobile paging

  const onDocumentLoadSuccess = (doc: { numPages: number }) => {
    setNumPages(doc.numPages);
    setCurrentPage(1);
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
          // If PDF fails to load, show download link
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <p className="text-gray-700">Unable to preview PDF.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Download PDF
            </a>
          </div>
        ) : (
          // Mobile PDF rendering
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
                  width={360} // Adjust based on screen size
                  className="shadow-sm bg-white"
                />
              ))}
            </Document>
          </div>
        )
      ) : (
        // Desktop PDF preview using iframe
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
