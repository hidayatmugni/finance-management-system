import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["localhost", ".ngrok-free.app"]
  },
  build: {
    // 700 kB is above the vendor chunks we deliberately keep whole (antd,
    // firebase); anything larger appearing here is a regression worth seeing.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        /**
         * Only split dependency trees that are genuinely self-contained.
         *
         * Splitting antd from @ant-design/icons produced two chunks that import
         * each other (antd renders icons; icons pull in antd's rc-* utilities).
         * Rollup cannot order a cycle, so one chunk evaluated before the other
         * had defined its bindings and the app died at runtime with
         * "Cannot access 'ft' before initialization". React, antd, the icon set
         * and the router therefore stay together — the shared total is
         * identical, only the file count differs.
         *
         * ExcelJS, Recharts and Firebase have no edge back into the UI tree, so
         * they split safely — and that is where the real win is: ExcelJS alone
         * is ~940 kB and is only fetched when someone exports.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("exceljs") || id.includes("xlsx")) return "vendor-excel";
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) {
            return "vendor-charts";
          }
          if (id.includes("firebase") || id.includes("@firebase")) return "vendor-firebase";

          return "vendor";
        }
      }
    }
  }
});
