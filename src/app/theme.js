import { theme as antdTheme } from "antd";

export const appTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: "#5b8cff",
    colorSuccess: "#29c173",
    colorWarning: "#d7a237",
    colorError: "#ff5b5b",
    colorInfo: "#66b6ff",
    colorTextBase: "#f4f7fb",
    colorBgBase: "#0b1118",
    colorBgLayout: "#0b1118",
    colorBgContainer: "#121a24",
    colorBorder: "#233041",
    colorSplit: "#1c2634",
    colorTextSecondary: "#95a4b8",
    fontFamily: "\"Manrope\", \"Segoe UI\", sans-serif",
    borderRadius: 20,
    borderRadiusLG: 24,
    borderRadiusSM: 14,
    boxShadowSecondary: "0 18px 38px rgba(0, 0, 0, 0.42)"
  },
  components: {
    Layout: {
      headerBg: "rgba(9, 15, 22, 0.84)",
      bodyBg: "#0b1118",
      footerBg: "rgba(10, 16, 24, 0.92)"
    },
    Card: {
      bodyPadding: 18,
      headerFontSize: 16,
      headerHeight: 44
    },
    Button: {
      controlHeight: 44,
      borderRadius: 16
    },
    Input: {
      controlHeight: 44
    },
    Select: {
      controlHeight: 44
    },
    Table: {
      headerBg: "#121b28",
      headerColor: "#e8edf5",
      rowHoverBg: "#131f2d"
    },
    Segmented: {
      trackBg: "#162130"
    },
    Tabs: {
      itemColor: "#95a4b8",
      itemSelectedColor: "#7da7ff",
      itemHoverColor: "#7da7ff",
      inkBarColor: "#7da7ff"
    },
    Input: {
      activeBorderColor: "#5b8cff",
      hoverBorderColor: "#5b8cff"
    },
    Select: {
      activeBorderColor: "#5b8cff",
      hoverBorderColor: "#5b8cff"
    },
    Radio: {
      buttonSolidCheckedBg: "#5b8cff",
      buttonSolidCheckedHoverBg: "#6b98ff",
      buttonCheckedBg: "#5b8cff",
      buttonCheckedHoverBg: "#6b98ff",
      buttonColor: "#f4f7fb"
    }
  }
};
