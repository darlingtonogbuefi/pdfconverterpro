// src/components/pdf-editor/PdfEditor.tsx

import { useEffect, useRef } from "react";

type Props = {
  fileUrl: string;
};

export default function PdfEditor({ fileUrl }: Props) {
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
        showSignButton: false, // no signing needed
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // 🔹 Auto-enable Word-like PDF editing
      instance.setViewState((viewState: any) =>
        viewState.set(
          "interactionMode",
          NutrientViewer.InteractionMode.CONTENT_EDITOR
        )
      );

      // 🔹 Enable history (optional for undo/redo, kept for internal tracking)
      instance.history.enable();

      // 🔹 Custom center buttons
      const backButton = {
        type: "custom",
        id: "go-back",
        title: "Back",
        onPress: () => window.history.back(),
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

      const textEditorButton = {
        type: "custom",
        id: "text-editor",
        title: "Edit PDF",
        onPress: () => {
          instance.setViewState((viewState: any) =>
            viewState.set(
              "interactionMode",
              NutrientViewer.InteractionMode.CONTENT_EDITOR
            )
          );
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
          textEditorButton,
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
