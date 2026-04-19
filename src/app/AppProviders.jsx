import { App, ConfigProvider } from "antd";
import { AuthProvider } from "../features/auth/AuthProvider";
import { appTheme } from "./theme";

export function AppProviders({ children }) {
  return (
    <ConfigProvider theme={appTheme}>
      <App>
        <AuthProvider>{children}</AuthProvider>
      </App>
    </ConfigProvider>
  );
}
