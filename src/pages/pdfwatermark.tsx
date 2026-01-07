// src/pages/pdfwatermark.tsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PdfViewer from "@/components/pdf-watermark/PdfViewer";
import PdfToolbar from "@/components/pdf-watermark/PdfToolbar";
import WatermarkModal from "@/components/pdf-watermark/WatermarkModal";

export default function PdfWatermarkPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const file: File | undefined = location.state?.file;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(true); // auto-open
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setHistory([url]);
    setHistoryIndex(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyWatermark = (url: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(url);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setPdfUrl(url);
    setShowModal(false);
    setActiveButton(null); // reset selection after applying

    // ✅ Add to conversionHistory localStorage
    const existing = JSON.parse(localStorage.getItem("conversionHistory") || "[]");
    const newItem = {
      id: `${Date.now()}`,
      status: "completed",
      original_filename: file.name,
      file: { url, name: file.name },
      source_format: "PDF",
      target_format: "PDF",
      created_date: new Date().toISOString(),
    };
    localStorage.setItem("conversionHistory", JSON.stringify([newItem, ...existing]));
  };

  if (!pdfUrl || !file) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <PdfToolbar
        activeButton={activeButton}
        onBack={() => {
          setActiveButton("back");
          navigate("/"); // <-- always navigate to homepage
        }}
        onWatermark={() => {
          setActiveButton("watermark");
          setShowModal(true);
        }}
        onUndo={() => {
          setActiveButton("undo");
          if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPdfUrl(history[historyIndex - 1]);
          }
        }}
        onRedo={() => {
          setActiveButton("redo");
          if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPdfUrl(history[historyIndex + 1]);
          }
        }}
        onDownload={() => {
          setActiveButton("download");

          if (!file || !pdfUrl) return;

          // Download with original file name
          const link = document.createElement("a");
          link.href = pdfUrl;
          link.download = file.name; // Use uploaded file name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      />
      {/* Pass fileName to PdfViewer */}
      <PdfViewer url={pdfUrl} fileName={file.name} />
      <WatermarkModal
        open={showModal}
        onClose={() => setShowModal(false)}
        file={file}
        onApply={applyWatermark}
      />
    </div>
  );
}
