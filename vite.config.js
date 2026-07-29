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
         * Vendors are split so a change in app code never invalidates the
         * cached copy of React/antd/Firebase, and so the heavy optional
         * dependencies (ExcelJS, Recharts) stay out of the first paint.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("exceljs") || id.includes("xlsx")) return "vendor-excel";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("firebase") || id.includes("@firebase")) return "vendor-firebase";
          if (id.includes("@ant-design/icons")) return "vendor-icons";
          if (id.includes("antd") || id.includes("rc-")) return "vendor-antd";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("/react/") || id.includes("react-dom") || id.includes("scheduler")) {
            return "vendor-react";
          }

          return "vendor";
        }
      }
    }
  }
});
