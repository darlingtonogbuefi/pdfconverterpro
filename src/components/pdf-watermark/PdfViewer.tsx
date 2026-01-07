// src/components/pdf-watermark/PdfViewer.tsx
type PdfViewerProps = {
  url: string;
  fileName: string; // you can keep this in case you need it elsewhere
};

export default function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="flex-1 w-full overflow-auto bg-gray-50 relative">
      {/* PDF iframe */}
      <iframe
        src={url}
        className="w-full h-full border"
        title="PDF Viewer"
        style={{ filter: "blur(0px)" }}
      />
    </div>
  );
}
