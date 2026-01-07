// src\components\pdf-watermark\PdfToolbar.tsx

import { Button } from "@/components/ui/button";

type PdfToolbarProps = {
  onBack: () => void;
  onWatermark: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  activeButton?: string; // tracks selected button
};

export default function PdfToolbar({
  onBack,
  onWatermark,
  onUndo,
  onRedo,
  onDownload,
  activeButton,
}: PdfToolbarProps) {
  // base classes for buttons
  // Use border-[0.5px] for thinner lines
  const baseClasses =
    "h-full text-gray-900 border-l border-r border-gray-300 border-[0.5px] rounded-none shadow-none focus:outline-none focus:ring-0";

  const getButtonClass = (name: string) =>
    activeButton === name
      ? `bg-gray-200 ${baseClasses}`
      : `bg-transparent hover:bg-gray-100 ${baseClasses}`;

  return (
    <div className="flex justify-center p-0 bg-white border-b border-gray-300 border-l border-r border-[0.5px] h-10">
      <Button className={getButtonClass("back")} onClick={onBack} style={{ lineHeight: "2.5rem" }}>
        Back
      </Button>
      <Button className={getButtonClass("watermark")} onClick={onWatermark} style={{ lineHeight: "2.5rem" }}>
        Add Watermark
      </Button>
      <Button className={getButtonClass("undo")} onClick={onUndo} style={{ lineHeight: "2.5rem" }}>
        Undo
      </Button>
      <Button className={getButtonClass("redo")} onClick={onRedo} style={{ lineHeight: "2.5rem" }}>
        Redo
      </Button>
      <Button className={getButtonClass("download")} onClick={onDownload} style={{ lineHeight: "2.5rem" }}>
        Download
      </Button>
    </div>
  );
}
