import { theme as antdTheme } from "antd";
import { themePalette } from "../shared/config/themePalette";

export const appTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: themePalette.colors.primary,
    colorSuccess: themePalette.colors.success,
    colorWarning: themePalette.colors.warning,
    colorError: themePalette.colors.expense,
    colorInfo: themePalette.colors.info,
    colorTextBase: themePalette.colors.ink,
    colorBgBase: themePalette.colors.canvas,
    colorBgLayout: themePalette.colors.canvas,
    colorBgContainer: themePalette.colors.panel,
    colorBorder: themePalette.colors.line,
    colorSplit: themePalette.colors.lineSoft,
    colorTextSecondary: themePalette.colors.muted,
    fontFamily: themePalette.fontFamily,
    borderRadius: 14,
    borderRadiusLG: 16,
    borderRadiusSM: 10,
    boxShadowSecondary: themePalette.shadows.cardStrong
  },
  components: {
    Layout: {
      headerBg: "rgba(22, 19, 33, 0.94)",
      bodyBg: themePalette.colors.canvas,
      footerBg: "rgba(22, 19, 33, 0.96)"
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
      headerBg: themePalette.colors.panelHeader,
      headerColor: themePalette.colors.inkSoft,
      rowHoverBg: themePalette.colors.panelHover
    },
    Segmented: {
      trackBg: themePalette.colors.panelHeader
    },
    Tabs: {
      itemColor: themePalette.colors.muted,
      itemSelectedColor: themePalette.colors.primary,
      itemHoverColor: themePalette.colors.primary,
      inkBarColor: themePalette.colors.primary
    },
    Input: {
      activeBorderColor: themePalette.colors.primary,
      hoverBorderColor: themePalette.colors.primary
    },
    Select: {
      activeBorderColor: themePalette.colors.primary,
      hoverBorderColor: themePalette.colors.primary
    },
    Radio: {
      buttonSolidCheckedBg: themePalette.colors.primaryStrong,
      buttonSolidCheckedHoverBg: themePalette.colors.primaryStrong,
      buttonCheckedBg: themePalette.colors.primarySoft,
      buttonCheckedHoverBg: themePalette.colors.primarySoft,
      buttonColor: themePalette.colors.ink
    }
  }
};
