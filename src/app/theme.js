import { theme as antdTheme } from "antd";

export const appTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: "#16b364",
    colorSuccess: "#16b364",
    colorWarning: "#f5b546",
    colorError: "#f04452",
    colorInfo: "#1f8a56",
    colorTextBase: "#f1f5f9",
    colorBgBase: "#0f0f10",
    colorBgLayout: "#0f0f10",
    colorBgContainer: "#171717",
    colorBorder: "#2a2a2c",
    colorSplit: "#232325",
    colorTextSecondary: "#8e949e",
    fontFamily: "\"IBM Plex Sans\", \"Segoe UI\", sans-serif",
    borderRadius: 14,
    borderRadiusLG: 16,
    borderRadiusSM: 10,
    boxShadowSecondary: "0 12px 28px rgba(0, 0, 0, 0.34)"
  },
  components: {
    Layout: {
      headerBg: "rgba(16, 16, 17, 0.92)",
      bodyBg: "#0f0f10",
      footerBg: "rgba(16, 16, 17, 0.96)"
    },
    Card: {
      bodyPadding: 12,
      headerFontSize: 14,
      headerHeight: 40
    },
    Button: {
      controlHeight: 38,
      borderRadius: 10
    },
    Input: {
      controlHeight: 38
    },
    Select: {
      controlHeight: 38
    },
    Table: {
      headerBg: "#1b1b1d",
      headerColor: "#dfe5ec",
      rowHoverBg: "#1a1a1c"
    },
    Segmented: {
      trackBg: "#1b1b1d"
    },
    Tabs: {
      itemColor: "#8e949e",
      itemSelectedColor: "#16b364",
      itemHoverColor: "#16b364",
      inkBarColor: "#16b364"
    },
    Input: {
      activeBorderColor: "#16b364",
      hoverBorderColor: "#16b364"
    },
    Select: {
      activeBorderColor: "#16b364",
      hoverBorderColor: "#16b364"
    },
    Radio: {
      buttonSolidCheckedBg: "#16b364",
      buttonSolidCheckedHoverBg: "#19c06c",
      buttonCheckedBg: "#16b364",
      buttonCheckedHoverBg: "#19c06c",
      buttonColor: "#f4f7fb"
    }
  }
};
