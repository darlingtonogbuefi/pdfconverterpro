// src/components/pdf-watermark/WatermarkModal.tsx
import { useState, useCallback } from "react";
import { pdfWatermark } from "@/lib/converters";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const predefinedTexts = [
  "Approved",
  "Not Approved",
  "Draft",
  "Final",
  "Completed",
  "Confidential",
  "For Public Release",
  "Not For Public Release",
  "For Comment",
  "Void",
  "Preliminary Results",
  "Information Only",
  "Rejected",
  "Accepted",
  "Initial Here",
  "Sign Here",
  "Witness",
  "As Is",
  "Departmental",
  "Experimental",
  "Expired",
  "Sold",
  "Top Secret",
  "Revised",
];

export default function WatermarkModal({ open, onClose, file, onApply }: any) {
  const [type, setType] = useState<"image" | "text">("image");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [tile, setTile] = useState<"straight" | "diagonal">("straight");
  const [opacity, setOpacity] = useState(0.3);
  const [horizontalBoxes, setHorizontalBoxes] = useState(3);
  const [verticalBoxes, setVerticalBoxes] = useState(6);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const placeholderText = "--Select predefined text--";

  // Button active logic
  const isApplyActive =
    (type === "image" && image) ||
    (type === "text" && text.trim() !== "" && text !== placeholderText);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) setImage(file);
      e.target.value = "";
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0] || null;
    if (file) setImage(file);
  }, []);

  const handleApplyWatermark = async () => {
    if (!isApplyActive || !file) return;
    setLoading(true);

    try {
      const payload = {
        watermark:
          type === "text"
            ? {
                type: "text",
                text,
                font: "Helvetica",
                font_size: 40,
                color: "#808080",
                opacity,
                angle: 45,
                save_as_image: false,
                dpi: 300,
              }
            : {
                type: "image",
                opacity,
                angle: 0,
                save_as_image: false,
                dpi: 300,
              },
        placement: {
          mode: "grid",
          tile_type: tile,
          horizontal_boxes: horizontalBoxes,
          vertical_boxes: verticalBoxes,
        },
        imageFile: image || undefined,
      };

      const finalFile = await pdfWatermark(file, payload);
      onApply(finalFile.url);
    } catch (err: any) {
      alert(err.message || "Failed to apply watermark");
    } finally {
      setLoading(false);
    }
  };

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const previewColor = hexToRgba("#999999", 1);
  const previewBrightness = 1 + (1 - opacity) * 0.7;

  // Preview container classes
  const imagePreviewClass =
    "border-2 border-dashed rounded flex items-center justify-center bg-white w-4/5 max-w-full aspect-[2.5/1]";
  const textPreviewClass =
    "border-2 border-dashed rounded flex items-center justify-center bg-white w-4/5 max-w-full aspect-[2.5/1]";

  const previewText = text || placeholderText;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          fixed top-1/2 left-1/2
          transform -translate-x-1/2 -translate-y-1/2
          w-full max-w-3xl
          max-h-[80vh]
          !rounded
          flex flex-col p-4
          bg-white
          overflow-auto
          text-xs
        "
      >
        <h2 className="text-sm font-semibold mb-4">Add Watermark</h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-0">
          <button
            onClick={() => setType("image")}
            className={`pb-1 transition-colors ${
              type === "image"
                ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Image
          </button>

          <button
            onClick={() => setType("text")}
            className={`pb-1 transition-colors ${
              type === "text"
                ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Text
          </button>
        </div>

        {/* Text Watermark */}
        {type === "text" && (
          <>
            <div className="flex gap-2 w-full">
              <input
                className="border rounded text-xs flex-1 p-1"
                placeholder="Enter Watermark text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <select
                className="border rounded text-xs p-1 w-52"
                value={text}
                onChange={(e) => setText(e.target.value)}
              >
                <option value="">{placeholderText}</option>
                {predefinedTexts.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex justify-center">
              <div className={textPreviewClass}>
                <div
                  className="select-none text-center max-w-full max-h-full overflow-hidden flex items-center justify-center"
                  style={{
                    fontFamily: "Helvetica",
                    fontSize: "clamp(16px,5vw,40px)",
                    color: previewColor,
                    opacity,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    transform: `rotate(${tile === "diagonal" ? 45 : 0}deg)`,
                  }}
                >
                  {previewText}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Image Watermark */}
        {type === "image" && (
          <div className="mt-3 flex flex-col justify-start items-center w-full">
            {/* Spacer to match text input + select row height */}
            <div className="h-9 w-full" />
            <div
              className={`${imagePreviewClass} ${
                isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : ""
              }`}
              onClick={() =>
                document.getElementById("watermark-file-input")?.click()
              }
              onDragEnter={() => setIsDragging(true)}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                id="watermark-file-input"
                className="hidden"
                onChange={handleFileInput}
              />

              {image ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{
                      opacity,
                      filter: `brightness(${previewBrightness})`,
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(255,255,255,${
                        0.7 + (1 - opacity) * 0.3
                      })`,
                    }}
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="text-gray-600 border-gray-400 pointer-events-none rounded text-xs"
                >
                  Select Image
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Grid + Boxes + Opacity */}
        <div className="mt-3 w-full flex flex-col md:flex-row justify-between text-xs gap-3">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-1.5">
              <label className="w-[10ch] whitespace-nowrap">Grid Type:</label>
              <select
                className="border rounded px-1 py-0.5 flex-1 text-xs"
                onChange={(e) => setTile(e.target.value as any)}
                value={tile}
              >
                <option value="diagonal">Diagonal</option>
                <option value="straight">Straight</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="w-[10ch] whitespace-nowrap">Opacity:</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={opacity}
                onChange={(e) => setOpacity(+e.target.value)}
                className="flex-1"
              />
              <span className="w-6 text-right">{Math.round(opacity * 100)}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-1.5 justify-end">
              <label className="w-[12ch] whitespace-nowrap">Horizontal Boxes:</label>
              <input
                type="number"
                min={1}
                value={horizontalBoxes}
                onChange={(e) => setHorizontalBoxes(+e.target.value)}
                className="border rounded px-1 py-0.5 w-[4ch] text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 justify-end">
              <label className="w-[12ch] whitespace-nowrap">Vertical Boxes:</label>
              <input
                type="number"
                min={1}
                value={verticalBoxes}
                onChange={(e) => setVerticalBoxes(+e.target.value)}
                className="border rounded px-1 py-0.5 w-[4ch] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-1.5 mt-auto text-xs">
          <Button
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 rounded text-xs px-2 py-1"
            onClick={() => {
              setText("");
              setImage(null);
            }}
          >
            Clear
          </Button>

          <Button
            onClick={handleApplyWatermark}
            disabled={!isApplyActive || loading}
            className={`border rounded px-2 py-1 text-xs ${
              isApplyActive && !loading
                ? "bg-blue-800 text-white hover:bg-blue-900"
                : "bg-gray-700 text-white cursor-not-allowed"
            }`}
          >
            {loading ? "Applying..." : "Apply Watermark"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
