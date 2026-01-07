// src/pages/pdfstamper.tsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PdfStamper from "@/components/pdf-stamp/PdfStamper"; // Your custom PdfStamper component

export default function PdfStamperPage() {
  const location = useLocation();
  const file: File | undefined = location.state?.file;

  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Create browser URL for uploaded PDF
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url); // Clean up URL on unmount
  }, [file]);

  if (!file) return <p>No PDF file provided.</p>;
  if (!fileUrl) return <p>Loading PDF...</p>;

  return <PdfStamper fileUrl={fileUrl} />;
}
