// src/components/pdf-watermark/PdfViewer.tsx


import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import '@/lib/pdfjs';

type PdfViewerProps = {
  url: string;
  fileName: string;
};

export default function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setLoading(true);

        const pdf = await pdfjsLib.getDocument(url).promise;
        if (!containerRef.current) return;

        containerRef.current.innerHTML = ''; // clear previous preview

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) break;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // ✅ Correct PDF.js render for latest version
          await page.render({
            canvas,   // HTMLCanvasElement
            viewport, // PageViewport
          }).promise;

          canvas.className = 'mx-auto mb-4 shadow';
          containerRef.current.appendChild(canvas);

          // ✅ Yield control to browser to avoid UI freezing
          await new Promise((r) => setTimeout(r, 0));
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error('PDF preview error:', err);
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [url]);

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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
          Loading PDF preview…
        </div>
      )}

      {/* Container for multi-page canvas previews */}
      <div ref={containerRef} className="px-2 py-2" />
    </div>
  );
}
