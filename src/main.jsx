import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "antd/dist/reset.css";
import "./index.css";
import { router } from "./app/router";
import { AppProviders } from "./app/AppProviders";
import { registerServiceWorker } from "./shared/lib/pwa";
import { applyTheme } from "./shared/design/themes";
import { useAppConfigStore } from "./shared/config/useAppConfig";

// Paint the stored theme before React mounts so there is no flash of the
// default palette on reload.
const bootTheme = useAppConfigStore.getState().config.theme;
const storedTheme = (() => {
  try {
    return window.localStorage.getItem("fm:theme");
  } catch {
    return null;
  }
})();

applyTheme(storedTheme || bootTheme.activeTheme, {
  primaryColor: bootTheme.primaryColor || undefined,
  radiusScale: bootTheme.radiusScale,
  fontScale: bootTheme.fontScale
});

registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
