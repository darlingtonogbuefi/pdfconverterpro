// src/pages/pdf-editor.tsx

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PdfEditor from "@/components/pdf-editor/PdfEditor";

export default function PdfEditorPage() {
  const location = useLocation();
  const file: File | undefined = location.state?.file;

  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Create browser URL for uploaded PDF
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return <p>No PDF file provided.</p>;
  if (!fileUrl) return <p>Loading PDF…</p>;

  return <PdfEditor fileUrl={fileUrl} />;
}
