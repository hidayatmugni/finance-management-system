import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "antd/dist/reset.css";
import { router } from "./app/router";
import { AppProviders } from "./app/AppProviders";
import "./index.css";
import { registerServiceWorker } from "./shared/lib/pwa";
import { applyThemeCssVariables } from "./shared/config/themePalette";

applyThemeCssVariables();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
