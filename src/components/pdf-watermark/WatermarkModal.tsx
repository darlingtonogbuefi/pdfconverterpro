// src/components/pdf-watermark/WatermarkModal.tsx

import { useState, useCallback, useRef, useLayoutEffect } from "react";
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
  const [showBlueBorder, setShowBlueBorder] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const placeholderText = "--Predefined Text--";

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
      if (type === "text" && (text.trim() === "" || text === placeholderText)) {
        alert("Please enter valid text or select a predefined text.");
        return;
      }

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
                angle: 45,
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

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const previewColor = hexToRgba("#999999", 1);
  const previewBrightness = 1 + (1 - opacity) * 0.8;

  const imagePreviewClass =
    "border-2 border-dashed rounded flex items-center justify-center bg-white w-4/5 max-w-full aspect-[2.5/1] relative max-w-[567px] max-h-[227px]";
  const textPreviewClass =
    "border-2 border-dashed rounded flex items-center justify-center bg-white w-4/5 max-w-full aspect-[2.5/1] relative max-w-[567px] max-h-[227px]";

  const previewText = text || placeholderText;

  // Auto-scale and center text preview
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || !el.parentElement) return;

    const parent = el.parentElement;

    const updateScale = () => {
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      const angle = tile === "diagonal" ? 45 : 0;
      const rad = (angle * Math.PI) / 180;

      const elWidth = el.scrollWidth;
      const elHeight = el.scrollHeight;

      // calculate rotated bounding box
      const rotatedWidth = Math.abs(elWidth * Math.cos(rad)) + Math.abs(elHeight * Math.sin(rad));
      const rotatedHeight = Math.abs(elWidth * Math.sin(rad)) + Math.abs(elHeight * Math.cos(rad));

      const scale = Math.min(parentWidth / rotatedWidth, parentHeight / rotatedHeight, 1);

      el.style.transform = `translate(-50%, -50%) rotate(-${angle}deg) scale(${scale})`;
    };

    updateScale();

    const ro = new ResizeObserver(updateScale);
    ro.observe(parent);

    return () => ro.disconnect();
  }, [previewText, tile, opacity, type]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
       onClick={() => setShowBlueBorder(false)}
        className={`
          fixed top-1/2 left-1/2
          transform -translate-x-1/2 -translate-y-1/2
          w-[95%] max-w-3xl
          max-h-[90vh]
          !rounded
          flex flex-col p-4
          bg-white
          overflow-auto
          text-xs
          ${showBlueBorder ? "border-2 border-blue-600" : "border-0"}
         `}
      >
        <h2 className="text-sm font-semibold mb-4">Add Watermark</h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b">
          <button
            onClick={() => setType("image")}
            className={`relative pb-2 text-xs transition-colors ${
              type === "image"
                ? "text-blue-600 font-semibold"
                : "text-gray-600 font-semibold hover:text-blue-500"
            }`}
          >
            Image
            {type === "image" && (
              <span className="absolute left-1/2 -bottom-[2px] w-14 h-[2px] -translate-x-1/2 bg-blue-600" />
            )}
          </button>

          <button
            onClick={() => setType("text")}
            className={`relative pb-2 text-xs transition-colors ${
              type === "text"
                ? "text-blue-600 font-semibold"
                : "text-gray-600 font-semibold hover:text-blue-500"
            }`}
          >
            Text
            {type === "text" && (
              <span className="absolute left-1/2 -bottom-[2px] w-14 h-[2px] -translate-x-1/2 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Text Watermark */}
        {type === "text" && (
          <>
            <div className="flex w-full justify-between gap-2 mt-2">
              <input
                className="border rounded text-xs p-1 max-w-[300px] w-full"
                placeholder="Enter Watermark text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 25))}
                maxLength={25}
              />

              <select
                className="border rounded text-xs p-1 max-w-[300px] w-full"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 25))}
              >
                <option value="">{placeholderText}</option>
                {predefinedTexts.map((t) => (
                  <option key={t} value={t.slice(0, 25)}>
                    {t.slice(0, 25)}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div className="mt-1 flex flex-col items-center">
              <div className={textPreviewClass}>
                <div
                  ref={textRef}
                  className="select-none text-center absolute top-1/2 left-1/2"
                  style={{
                    fontFamily: "Helvetica",
                    fontSize: "clamp(16px,5vw,40px)",
                    color: previewColor,
                    opacity,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    transformOrigin: "center center",
                    transform: `translate(-50%, -50%) rotate(${tile === "diagonal" ? -45 : 0}deg) scale(1)`,
                  }}
                >
                  {previewText}
                </div>
              </div>
              <p className="mt-5 text-gray-500 text-xs">
                Enter Text or Select Predefined Text
              </p>
            </div>
          </>
        )}

        {/* Image Watermark */}
        {type === "image" && (
          <div className="mt-5 flex flex-col justify-start items-center w-full">
            <div className="h-8 w-full" />
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
                    className="max-w-full max-h-full object-contain"
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

            <p className="mt-5 text-gray-500 text-xs">
              Select or Drag and Drop Image
            </p>
          </div>
        )}

        {/* Grid + Boxes + Opacity */}
        <div className="mt-2 w-full flex flex-col md:flex-row justify-between text-xs gap-3">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-1.5">
              <label className="w-[10ch] whitespace-nowrap">Grid Type:</label>
              <select
                className="border rounded px-1 py-1 flex-1 text-xs"
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
                max={15}
                value={horizontalBoxes}
                onChange={(e) => setHorizontalBoxes(+e.target.value)}
                className="border rounded px-1 py-1 w-[6ch] text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 justify-end">
              <label className="w-[12ch] whitespace-nowrap">Vertical Boxes:</label>
              <input
                type="number"
                min={1}
                max={15}
                value={verticalBoxes}
                onChange={(e) => setVerticalBoxes(+e.target.value)}
                className="border rounded px-1 py-1 w-[6ch] text-xs"
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
