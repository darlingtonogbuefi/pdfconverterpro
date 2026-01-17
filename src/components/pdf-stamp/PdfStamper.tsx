// src/components/pdf-stamp/PdfStamper.tsx

import { useEffect, useRef } from "react";

type Props = {
  fileUrl: string;
};

export default function PdfStamper({ fileUrl }: Props) {
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
        showStampButton: true,  // keep existing stamp icon button
        showDrawButton: false,
        showSignButton: false,
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // 🔹 Auto-open stamp tool on load
      instance.setViewState((viewState: any) =>
        viewState.set("interactionMode", NutrientViewer.InteractionMode.STAMP_PICKER)
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

      // 🔹 Text Stamp PDF button (replaces Preview PDF)
      const textStampButton = {
        type: "custom",
        id: "text-stamp",
        title: "Stamp PDF",
        onPress: () => {
          try {
            // Launch stamp popup for text stamps
            instance.setViewState((viewState: any) =>
              viewState.set("interactionMode", NutrientViewer.InteractionMode.STAMP_PICKER)
            );
          } catch (err) {
            console.error("Error opening stamp tool:", err);
          }
        },
      };

      // 🔹 Helper: Build toolbar with custom buttons
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
          textStampButton, // new Text Stamp PDF button
          { type: "spacer" },
          ...rightItems,
        ];
      };

      // 🔹 Refresh toolbar
      const refreshToolbar = () => {
        instance.setToolbarItems(buildToolbar(originalDefaultItems));
      };

      // 🔹 Initial toolbar setup
      instance.setToolbarItems((defaultItems: any[]) => {
        originalDefaultItems = [...defaultItems];
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
