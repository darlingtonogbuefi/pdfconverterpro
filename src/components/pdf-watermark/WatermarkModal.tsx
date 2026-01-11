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

  const isApplyActive =
    (type === "image" && image) || (type === "text" && text);

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

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const previewColor = hexToRgba("#999999", 1);
  const previewBrightness = 1 + (1 - opacity) * 0.7;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          fixed inset-2 sm:inset-4
          w-auto max-w-[95vw] sm:max-w-2xl
          h-auto max-h-[95vh] sm:max-h-[90vh]
          !rounded
          flex flex-col p-4
          bg-white
          text-xs
          overflow-auto
        "
      >
        <h2 className="text-sm font-semibold mb-4">Add Watermark</h2>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-3">
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
            <input
              className="border w-full p-1 rounded text-xs"
              placeholder="Enter Watermark text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <select
              className="border w-full p-1 mt-1 rounded text-xs"
              onChange={(e) => setText(e.target.value)}
              value={text}
            >
              <option value="">-- Select predefined text --</option>
              {predefinedTexts.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {text && (
              <div className="mt-3 flex justify-center w-full">
                <div
                  className="border-2 border-dashed rounded flex items-center justify-center bg-white w-full max-w-[90%] aspect-[5/1]"
                >
                  <div
                    className="select-none text-[5vw] sm:text-[2rem]"
                    style={{
                      fontFamily: "Helvetica",
                      color: previewColor,
                      opacity,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      transform: `rotate(${tile === "diagonal" ? 45 : 0}deg)`,
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Image Watermark */}
        {type === "image" && (
          <div className="mt-3 flex justify-center w-full">
            <div
              className={`border-2 border-dashed rounded flex items-center justify-center bg-white ${
                isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : ""
              }`}
              style={{ width: "100%", maxWidth: "90%", aspectRatio: "2.5 / 1" }}
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
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      opacity,
                      transform: "rotate(0deg)",
                      filter: `brightness(${previewBrightness})`,
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: `rgba(255,255,255,${0.7 + (1 - opacity) * 0.3})`,
                      pointerEvents: "none",
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
        <div className="mt-3 w-full flex flex-col sm:flex-row justify-between text-xs gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <label className="w-[10ch] whitespace-nowrap">
                Grid Type:
              </label>
              <select
                className="border rounded px-1 py-0.5 flex-1 text-xs"
                onChange={(e) => setTile(e.target.value as any)}
                value={tile}
              >
                <option value="diagonal">Diagonal</option>
                <option value="straight">Straight</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <label className="w-[10ch] whitespace-nowrap">
                Opacity:
              </label>
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <label className="w-[12ch] whitespace-nowrap">
                Horizontal Boxes:
              </label>
              <input
                type="number"
                min={1}
                value={horizontalBoxes}
                onChange={(e) => setHorizontalBoxes(+e.target.value)}
                className="border rounded px-1 py-0.5 w-[4ch] text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="w-[12ch] whitespace-nowrap">
                Vertical Boxes:
              </label>
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
        <div className="flex justify-end gap-1.5 mt-auto text-xs flex-wrap sm:flex-nowrap">
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
