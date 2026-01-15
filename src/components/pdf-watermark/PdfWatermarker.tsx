// src/components/pdf-watermark/PdfWatermarker.tsx

import { useState } from "react";
import { pdfWatermark } from "@/lib/converters";
import { Button } from "@/components/ui/button";

type Props = {
  file: File;
  watermarkType: "text" | "image";
  watermarkText: string;
  watermarkFile: File | null;
  gridOptions: {
    tile_type: "straight" | "diagonal";
    horizontal_boxes: number;
    vertical_boxes: number;
  };
  textOpacity?: number;
  imageOpacity?: number;
  onComplete: (url: string) => void;
};

export default function PdfWatermarker({
  file,
  watermarkType,
  watermarkText,
  watermarkFile,
  gridOptions,
  textOpacity = 0.5,   // increased default for better visibility
  imageOpacity = 0.5,
  onComplete,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleApplyWatermark = async () => {
    setLoading(true);

    try {
      const payload = {
        watermark:
          watermarkType === "text"
            ? {
                type: "text",
                text: watermarkText,
                font: "Helvetica",
                font_size: 60,
                color: "#000000", // fully black for maximum visibility
                opacity: textOpacity,
                angle: 45,
                save_as_image: false,
                dpi: 300,
              }
            : {
                type: "image",
                opacity: imageOpacity,
                angle: 45,
                save_as_image: false,
                dpi: 300,
              },
        placement: {
          mode: "grid",
          tile_type: gridOptions.tile_type,
          horizontal_boxes: gridOptions.horizontal_boxes,
          vertical_boxes: gridOptions.vertical_boxes,
        },
        imageFile: watermarkFile || undefined,
      };

      const finalFile = await pdfWatermark(file, payload);
      onComplete(finalFile.url);
    } catch (err: any) {
      alert(err.message || "Failed to apply watermark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleApplyWatermark}
      disabled={loading}
      className="bg-gray-400 text-white hover:bg-gray-500"
    >
      {loading ? "Applying..." : "Apply Watermark"}
    </Button>
  );
}
