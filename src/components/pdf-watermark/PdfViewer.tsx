// src/components/pdf-watermark/PdfViewer.tsx


type PdfViewerProps = {
  url: string;
  fileName: string;
};

export default function PdfViewer({ url, fileName }: PdfViewerProps) {
  const isMobile =
    typeof window !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
        /* ✅ Mobile fallback (prevents forced download) */
        <div className="flex items-center justify-center h-full text-gray-600 text-sm">
          <div className="text-center space-y-2">
            <p className="font-medium">{fileName}</p>
            <p>PDF preview is not supported on mobile.</p>
            <p>You can still apply watermark and download.</p>
          </div>
        </div>
      ) : (
        /* ✅ Desktop PDF preview */
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
