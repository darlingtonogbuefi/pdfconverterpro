//  src/components/pdf-stamp/PdfStamper.tsx


import { useEffect, useRef } from "react";

type Props = {
  fileUrl: string;
};

export default function PdfStamper({ fileUrl }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null); // Create a reference to the container where the PDF viewer will be loaded.

  useEffect(() => {
    const container = viewerRef.current; // Access the container div
    const { NutrientViewer } = window as any; // Access the NutrientViewer SDK from the global window object.

    // Check if the container or NutrientViewer is not loaded properly
    if (!container || !NutrientViewer) {
      console.error("NutrientViewer SDK not loaded");
      return;
    }

    let instance: any;
    let originalDefaultItems: any[] = [];

    // Load the PDF into the viewer
    NutrientViewer.load({
      container, // The container where the PDF will be rendered
      document: fileUrl, // The URL to the PDF file
      ui: {
        showToolbar: true, // Show toolbar with custom buttons
        showStampButton: true, // Show the custom "stamp" button in the toolbar
        showDrawButton: false, // Remove the "draw" button from the toolbar
        showSignButton: false, // Remove the "sign" button from the toolbar
      },
    }).then((viewerInstance: any) => {
      instance = viewerInstance;

      // 🔹 Auto-open stamp tool when the document is loaded
      instance.setViewState((viewState: any) =>
        viewState.set("interactionMode", NutrientViewer.InteractionMode.STAMP_PICKER) // Set the viewer to stamp mode on load
      );

      // 🔹 Enable undo/redo history in the PDF viewer
      instance.history.enable();

      // 🔹 Custom center buttons
      const backButton = {
        type: "custom",
        id: "go-back",
        title: "Back",
        onPress: () => window.history.back(), // Go back to the previous page
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
          window.open(url, "_blank"); // Open the previewed PDF in a new tab
        },
      };

      // 🔹 Helper: Build toolbar by arranging the default toolbar items and custom buttons
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

      // 🔹 Refresh the toolbar whenever it needs to be updated
      const refreshToolbar = () => {
        instance.setToolbarItems(buildToolbar(originalDefaultItems));
      };

      // 🔹 Initial toolbar setup
      instance.setToolbarItems((defaultItems: any[]) => {
        originalDefaultItems = [...defaultItems]; // Save the original toolbar items
        return buildToolbar(defaultItems); // Return the custom toolbar
      });

      // 🔹 Update the toolbar whenever annotations change (for example, after stamping)
      instance.on("annotationsChanged", refreshToolbar);
    });

    // Cleanup when component unmounts
    return () => {
      if (instance) {
        NutrientViewer.unload(container); // Unload the NutrientViewer when the component is unmounted
      }
    };
  }, [fileUrl]); // Re-run the effect if the fileUrl changes

  // Render the viewer container
  return (
    <div>
      <div
        ref={viewerRef} // Attach the viewerRef to the div where the PDF viewer will render
        style={{
          width: "100%", // Full width
          height: "100vh", // Full viewport height
        }}
      />
    </div>
  );
}
