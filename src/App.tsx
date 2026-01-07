// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PdfSign from "./pages/pdfsign";
import PdfWatermark from "./pages/pdfwatermark";
import PdfStamperPage from "./pages/pdfstamper";
import PdfEditPage from "./pages/pdf-editor.tsx"; // ✅ NEW: PDF Edit page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main Index page */}
          <Route path="/" element={<Index />} />

          {/* PDF Sign */}
          <Route path="/pdfsign" element={<PdfSign />} />

          {/* PDF Watermark */}
          <Route path="/pdfwatermark" element={<PdfWatermark />} />

          {/* PDF Stamper */}
          <Route path="/pdfstamper" element={<PdfStamperPage />} />

          {/* ✅ PDF Edit */}
          <Route path="/pdfedit" element={<PdfEditPage />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
