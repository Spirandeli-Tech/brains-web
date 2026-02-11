import type { ThemeConfig } from "antd";

export const theme: ThemeConfig = {
  token: {
    // Brand
    colorPrimary: "#2563EB",
    colorPrimaryHover: "#1D4ED8",
    colorPrimaryActive: "#1E40AF",

    // Text
    colorText: "#111827",
    colorTextSecondary: "#4B5563",
    colorTextTertiary: "#6B7280",
    colorTextQuaternary: "#9CA3AF",

    // Backgrounds
    colorBgContainer: "#FFFFFF",
    colorBgLayout: "#F6F7F9",
    colorBgElevated: "#FFFFFF",

    // Borders
    colorBorder: "#E6EAF0",
    colorBorderSecondary: "#EEF1F5",
    colorSplit: "#EEF1F5",

    // Controls
    controlHeight: 40,
    controlHeightSM: 32,

    // Radius
    borderRadius: 10,
    borderRadiusSM: 8,
    borderRadiusLG: 12,

    // Typography
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 14,

    // Shadows
    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
    boxShadowSecondary: "0 8px 24px rgba(16, 24, 40, 0.12)",

    // Motion
    motionDurationFast: "0.12s",
    motionDurationMid: "0.18s",
    motionEaseInOut: "cubic-bezier(0.2, 0.8, 0.2, 1)",

    // Links
    colorLink: "#2563EB",
    colorLinkHover: "#1D4ED8",
    colorLinkActive: "#1E40AF",

    // Success / Warning / Error
    colorSuccess: "#047857",
    colorWarning: "#B45309",
    colorError: "#B91C1C",
    colorInfo: "#2563EB",
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightSM: 32,
      primaryShadow: "none",
      defaultBorderColor: "#E6EAF0",
      fontWeight: 500,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
      activeBorderColor: "#2563EB",
      activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.18)",
      hoverBorderColor: "#2563EB",
    },
    Select: {
      borderRadius: 10,
      controlHeight: 40,
      optionSelectedBg: "#EEF5FF",
      optionActiveBg: "#F3F5F8",
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 40,
      activeBorderColor: "#2563EB",
      activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.18)",
    },
    InputNumber: {
      borderRadius: 10,
      controlHeight: 40,
      activeBorderColor: "#2563EB",
      activeShadow: "0 0 0 3px rgba(37, 99, 235, 0.18)",
    },
    Table: {
      headerBg: "#FFFFFF",
      headerColor: "#6B7280",
      headerSplitColor: "#EEF1F5",
      rowHoverBg: "#F3F5F8",
      borderColor: "#EEF1F5",
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      headerBorderRadius: 0,
      fontWeightStrong: 500,
    },
    Modal: {
      borderRadiusLG: 16,
      titleFontSize: 18,
      paddingMD: 20,
      headerBg: "#FFFFFF",
      contentBg: "#FFFFFF",
    },
    Form: {
      labelFontSize: 12,
      labelColor: "#6B7280",
      verticalLabelPadding: "0 0 4px",
      itemMarginBottom: 12,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 16,
    },
    Dropdown: {
      borderRadiusLG: 12,
      paddingBlock: 8,
      controlItemBgActive: "#EEF5FF",
      controlItemBgHover: "#F3F5F8",
    },
    Pagination: {
      borderRadius: 8,
      itemActiveBg: "#EEF5FF",
    },
    Collapse: {
      borderRadiusLG: 12,
      headerBg: "#FFFFFF",
    },
  },
};
