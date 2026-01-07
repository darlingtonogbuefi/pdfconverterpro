//  src\global.d.ts

import NutrientViewer from "@nutrient-sdk/viewer";

declare global {
  interface Window {
    NutrientViewer?: typeof NutrientViewer;
  }
}
