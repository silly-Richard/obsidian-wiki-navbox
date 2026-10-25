export const ACCENT_NAMES = [
  "mint",
  "sky",
  "lilac",
  "rose",
  "amber",
  "slate",
] as const;

export type AccentName = (typeof ACCENT_NAMES)[number];

export type AppLanguage = "auto" | "zh" | "en";

export type Locale = "zh" | "en";

export type NavboxAction = "view" | "talk" | "edit";

export interface NavboxRow {
  label?: string;
  value: string;
}

export interface NavboxGroup {
  label?: string;
  value?: string;
  rows: NavboxRow[];
}

export interface NavboxSection {
  label?: string;
  value?: string;
  rows: NavboxRow[];
  groups: NavboxGroup[];
}

export type NavboxLink = string | boolean;

export interface NavboxLinks {
  view?: NavboxLink;
  talk?: NavboxLink;
  edit?: NavboxLink;
}

export interface NavboxModel {
  title: string;
  accent: AccentName;
  collapsed?: boolean;
  dense: boolean;
  links: NavboxLinks;
  footer?: string;
  sections: NavboxSection[];
}

export interface WikiNavboxSettings {
  language: AppLanguage;
  defaultAccent: AccentName;
  defaultCollapsed: boolean;
  showHeaderActions: boolean;
  showTalkAction: boolean;
  rememberCollapseState: boolean;
  createTalkPages: boolean;
  compact: boolean;
  themeLinkColor: boolean;
}

export const DEFAULT_SETTINGS: WikiNavboxSettings = {
  language: "auto",
  defaultAccent: "mint",
  defaultCollapsed: false,
  showHeaderActions: true,
  showTalkAction: false,
  rememberCollapseState: true,
  createTalkPages: true,
  compact: false,
  themeLinkColor: false,
};
