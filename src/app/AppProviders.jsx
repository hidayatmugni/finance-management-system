import { App as AntApp } from "antd";
import { AuthProvider } from "../features/auth/AuthProvider";
import { ThemeProvider } from "../shared/design/ThemeProvider";

/**
 * Provider order matters:
 *   ThemeProvider — owns ConfigProvider, so every antd component below it (and
 *                   every portal it renders) uses the active theme's tokens.
 *   AntApp        — supplies message/notification/modal through context, which
 *                   is what `useToast` builds on.
 *   AuthProvider  — session state consumed by the router guards.
 *
 * The CMS store hydrates itself from localStorage at import time, so themes are
 * correct on first paint without waiting for a provider.
 */
export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AntApp>
        <AuthProvider>{children}</AuthProvider>
      </AntApp>
    </ThemeProvider>
  );
}
