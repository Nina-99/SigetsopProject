import type { Mode } from "../@core";

export type Config = {
  templateName: string;
  settingsCookieName: string;
  mode: Mode;
  layoutPadding: number;
  compactContentWidth: number;
  disableRipple: boolean;
};

const themeConfig: Config = {
  templateName: "Sigetsop",
  settingsCookieName: "sigetsop-web",
  mode: "light", // 'light', 'dark'
  layoutPadding: 24, // Common padding for header, content, footer layout components (in px)
  compactContentWidth: 1440, // in px
  disableRipple: false, // true, false
};

export default themeConfig;
