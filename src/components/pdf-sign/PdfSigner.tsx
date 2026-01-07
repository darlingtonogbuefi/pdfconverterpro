// src/components/pdf-sign/PdfSigner.tsx

import { useEffect, useRef } from "react";

type Props = {
  fileUrl: string;
};

export default function PdfSigner({ fileUrl }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = viewerRef.current;
    const { NutrientViewer } = window as any;

    if (!container || !NutrientViewer) {
      console.error("NutrientViewer SDK not loaded");
      return;
    }

    let instance: any;
    let originalDefaultItems: any[] = [];

    NutrientViewer.load({
      container,
      document: fileUrl,
      ui: {
        showToolbar: true,
        showSignButton: true,
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // 🔹 Auto-open signature tool
      instance.setViewState((viewState: any) =>
        viewState.set("interactionMode", NutrientViewer.InteractionMode.SIGNATURE)
      );

      // 🔹 Enable history
      instance.history.enable();

      // 🔹 Custom center buttons
      const backButton = {
        type: "custom",
        id: "go-back",
        title: "Back",
        onPress: () => window.history.back(),
      };

      const undoButton = {
        type: "custom",
        id: "undo",
        title: "Undo",
        onPress: async () => {
          if (instance.history.canUndo()) {
            await instance.history.undo();
            refreshToolbar();
          }
        },
      };

      const redoButton = {
        type: "custom",
        id: "redo",
        title: "Redo",
        onPress: async () => {
          if (instance.history.canRedo()) {
            await instance.history.redo();
            refreshToolbar();
          }
        },
      };

      const previewButton = {
        type: "custom",
        id: "preview",
        title: "Preview PDF",
        onPress: async () => {
          const pdfBuffer = await instance.exportPDF();
          const blob = new Blob([pdfBuffer], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        },
      };

      // 🔹 Helper: build toolbar from original default items
      const buildToolbar = (defaultItems: any[]) => {
        const half = Math.ceil(defaultItems.length / 2);
        const leftItems = defaultItems.slice(0, half);
        const rightItems = defaultItems.slice(half);

        return [
          ...leftItems,
          { type: "spacer" },
          backButton,
          undoButton,
          redoButton,
          previewButton,
          { type: "spacer" },
          ...rightItems,
        ];
      };

      // 🔹 Refresh toolbar safely
      const refreshToolbar = () => {
        instance.setToolbarItems(buildToolbar(originalDefaultItems));
      };

      // 🔹 Initial toolbar setup
      instance.setToolbarItems((defaultItems: any[]) => {
        originalDefaultItems = [...defaultItems]; // save clean copy
        return buildToolbar(defaultItems);
      });

      // 🔹 Update toolbar when annotations change
      instance.on("annotationsChanged", refreshToolbar);
    });

    // Cleanup
    return () => {
      if (instance) {
        NutrientViewer.unload(container);
      }
    };
  }, [fileUrl]);

  return (
    <div
      ref={viewerRef}
      style={{
        width: "100%",
        height: "100vh",
      }}
    />
  );
}
