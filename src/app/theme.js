import { theme as antdTheme } from "antd";
import { getTheme, shadeColor } from "../shared/design/themes";
import { radii, typeScale } from "../shared/design/tokens";

/**
 * Translates one of our themes into an Ant Design token set.
 *
 * Ant components are styled from these tokens rather than from CSS overrides,
 * so a theme switch repaints buttons, tables, modals and pickers in one go.
 *
 * @param {string} themeId
 * @param {{ primaryColor?: string, radiusScale?: number, compact?: boolean, fontScale?: number }} overrides
 */
export function buildAntdTheme(themeId, overrides = {}) {
  const theme = getTheme(themeId);
  const colors = theme.colors;
  const isDark = theme.mode === "dark";

  const primary = overrides.primaryColor || colors.primary;
  const radiusScale = overrides.radiusScale ?? 1;
  const fontScale = overrides.fontScale ?? 1;
  const scaleRadius = (value) => Math.round(value * radiusScale);
  const scaleFont = (value) => Math.round(value * fontScale);
  const controlHeight = overrides.compact ? 34 : 38;

  const algorithms = [isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm];
  if (overrides.compact) algorithms.push(antdTheme.compactAlgorithm);

  return {
    algorithm: algorithms,
    token: {
      colorPrimary: primary,
      colorPrimaryHover: shadeColor(primary, isDark ? 10 : -10),
      colorPrimaryActive: shadeColor(primary, isDark ? -10 : -22),
      colorPrimaryBg: colors.primarySoft,
      colorPrimaryBorder: colors.primaryBorder,

      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.danger,
      colorInfo: colors.info,

      colorTextBase: colors.text,
      colorText: colors.text,
      colorTextSecondary: colors.textSecondary,
      colorTextTertiary: colors.textTertiary,
      colorTextQuaternary: colors.textTertiary,
      colorTextDescription: colors.textSecondary,
      colorTextPlaceholder: colors.textTertiary,

      colorBgBase: colors.surface,
      colorBgLayout: colors.bg,
      colorBgContainer: colors.surface,
      colorBgElevated: colors.surfaceRaised,
      colorBgSpotlight: colors.surfaceRaised,
      colorFillAlter: colors.surfaceSunken,
      colorFillSecondary: colors.surfaceSunken,
      colorFillTertiary: colors.surfaceHover,
      colorFillQuaternary: colors.surfaceHover,

      colorBorder: colors.border,
      colorBorderSecondary: colors.border,
      colorSplit: colors.border,

      fontFamily: theme.fonts.body,
      fontSize: scaleFont(typeScale.body),
      fontSizeSM: scaleFont(typeScale.small),
      fontSizeLG: scaleFont(typeScale.subtitle),
      fontSizeHeading1: scaleFont(typeScale.display),
      fontSizeHeading2: scaleFont(typeScale.headline),
      fontSizeHeading3: scaleFont(typeScale.title),
      fontSizeHeading4: scaleFont(typeScale.subtitle),
      fontSizeHeading5: scaleFont(typeScale.bodyLarge),

      borderRadius: scaleRadius(radii.md),
      borderRadiusLG: scaleRadius(radii.lg),
      borderRadiusSM: scaleRadius(radii.sm),
      borderRadiusXS: scaleRadius(radii.xs),

      controlHeight,
      controlHeightLG: controlHeight + 6,
      controlHeightSM: controlHeight - 6,

      boxShadow: theme.shadows.sm,
      boxShadowSecondary: theme.shadows.md,
      boxShadowTertiary: theme.shadows.xs,
      wireframe: false
    },
    components: {
      Layout: {
        headerBg: colors.surface,
        bodyBg: colors.bg,
        siderBg: colors.surface,
        footerBg: colors.surface,
        headerPadding: 0
      },
      Card: {
        headerBg: "transparent",
        headerFontSize: scaleFont(typeScale.bodyLarge),
        headerHeight: 48,
        bodyPadding: 16,
        colorBorderSecondary: colors.border
      },
      Button: {
        primaryShadow: "none",
        defaultShadow: "none",
        dangerShadow: "none",
        primaryColor: colors.onPrimary,
        fontWeight: 500
      },
      Table: {
        headerBg: colors.surfaceSunken,
        headerColor: colors.textSecondary,
        headerSplitColor: colors.border,
        rowHoverBg: colors.surfaceHover,
        rowSelectedBg: colors.primarySoft,
        rowSelectedHoverBg: colors.primarySoft,
        borderColor: colors.border,
        cellPaddingBlock: 10,
        cellPaddingBlockSM: 8
      },
      Segmented: {
        trackBg: colors.surfaceSunken,
        itemSelectedBg: colors.surface,
        itemSelectedColor: primary,
        itemHoverBg: colors.surfaceHover,
        trackPadding: 3
      },
      Tabs: {
        itemColor: colors.textSecondary,
        itemSelectedColor: primary,
        itemHoverColor: primary,
        inkBarColor: primary,
        titleFontSize: scaleFont(typeScale.body),
        horizontalMargin: "0 0 16px 0"
      },
      Menu: {
        itemBg: "transparent",
        subMenuItemBg: "transparent",
        itemSelectedBg: colors.primarySoft,
        itemSelectedColor: primary,
        itemHoverBg: colors.surfaceHover,
        itemBorderRadius: scaleRadius(radii.md),
        itemMarginInline: 0
      },
      Input: { activeShadow: `0 0 0 3px ${primary}33`, addonBg: colors.surfaceSunken },
      InputNumber: { activeShadow: `0 0 0 3px ${primary}33` },
      Select: { optionSelectedBg: colors.primarySoft, optionSelectedColor: primary },
      DatePicker: { cellActiveWithRangeBg: colors.primarySoft },
      Modal: {
        titleFontSize: scaleFont(typeScale.subtitle),
        borderRadiusLG: scaleRadius(radii.xl),
        contentBg: colors.surface,
        headerBg: colors.surface
      },
      Drawer: { footerPaddingBlock: 12 },
      Progress: { defaultColor: primary, remainingColor: colors.surfaceSunken },
      Tag: { defaultBg: colors.surfaceSunken, defaultColor: colors.textSecondary },
      Alert: {
        colorInfoBg: colors.infoSoft,
        colorInfoBorder: colors.infoSoft,
        colorSuccessBg: colors.successSoft,
        colorSuccessBorder: colors.successSoft,
        colorWarningBg: colors.warningSoft,
        colorWarningBorder: colors.warningSoft,
        colorErrorBg: colors.dangerSoft,
        colorErrorBorder: colors.dangerSoft
      },
      Tooltip: {
        colorBgSpotlight: isDark ? colors.surfaceRaised : colors.text,
        colorTextLightSolid: isDark ? colors.text : colors.textInverse
      },
      Statistic: { contentFontSize: scaleFont(typeScale.title) },
      Divider: { colorSplit: colors.border },
      Empty: { colorTextDescription: colors.textTertiary }
    }
  };
}
