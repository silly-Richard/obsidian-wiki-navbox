import {
  ACCENT_NAMES,
  type AccentName,
  type Locale,
  type NavboxGroup,
  type NavboxLinks,
  type NavboxModel,
  type NavboxRow,
  type NavboxSection,
} from "./types";
import { createI18n, type I18n } from "./i18n";

export class NavboxConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NavboxConfigError";
  }
}

export interface NormalizeOptions {
  defaultAccent: AccentName;
  language?: Locale;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function assertScalar(
  value: unknown,
  context: string,
  field: "label" | "content",
  i18n: I18n,
): void {
  if (value === undefined || value === null) {
    return;
  }
  if (readText(value) === undefined) {
    throw new NavboxConfigError(
      i18n.t("error.scalar", {
        context,
        field: i18n.t(
          field === "label" ? "error.field.label" : "error.field.content",
        ),
      }),
    );
  }
}

function readTrimmed(value: unknown): string | undefined {
  const text = readText(value);
  if (text === undefined) {
    return undefined;
  }
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readLabel(raw: Record<string, unknown>): string | undefined {
  return readTrimmed(raw.label ?? raw.name ?? raw.title);
}

function readValue(raw: Record<string, unknown>): string | undefined {
  return readText(raw.value ?? raw.content ?? raw.text);
}

function normalizeRow(
  raw: unknown,
  context: string,
  i18n: I18n,
): NavboxRow | null {
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return null;
    }
    if (raw.length === 1) {
      assertScalar(raw[0], context, "content", i18n);
      return { value: readText(raw[0]) ?? "" };
    }
    assertScalar(raw[0], context, "label", i18n);
    assertScalar(raw[1], context, "content", i18n);
    const label = readTrimmed(raw[0]);
    return { label, value: readText(raw[1]) ?? "" };
  }

  const text = readText(raw);
  if (text !== undefined) {
    return { value: text };
  }

  if (!isRecord(raw)) {
    throw new NavboxConfigError(
      i18n.t("error.rowType", { context }),
    );
  }

  assertScalar(raw.label ?? raw.name ?? raw.title, context, "label", i18n);
  assertScalar(raw.value ?? raw.content ?? raw.text, context, "content", i18n);
  const label = readLabel(raw);
  const value = readValue(raw);
  if (label === undefined && value === undefined) {
    return null;
  }
  return { label, value: value ?? "" };
}

function normalizeRows(
  raw: unknown,
  context: string,
  i18n: I18n,
): NavboxRow[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new NavboxConfigError(
      i18n.t("error.rowsArray", { context }),
    );
  }
  const rows: NavboxRow[] = [];
  raw.forEach((entry, index) => {
    const row = normalizeRow(
      entry,
      i18n.t("context.row", { context, index: index + 1 }),
      i18n,
    );
    if (row !== null) {
      rows.push(row);
    }
  });
  return rows;
}

function normalizeGroup(
  raw: unknown,
  context: string,
  i18n: I18n,
): NavboxGroup | null {
  if (!isRecord(raw)) {
    throw new NavboxConfigError(
      i18n.t("error.groupObject", { context }),
    );
  }
  if (Array.isArray(raw.groups) && raw.groups.length > 0) {
    throw new NavboxConfigError(i18n.t("error.nestedGroups"));
  }

  const label = readLabel(raw);
  const value = readValue(raw);
  assertScalar(raw.label ?? raw.name ?? raw.title, context, "label", i18n);
  assertScalar(raw.value ?? raw.content ?? raw.text, context, "content", i18n);
  const rows = normalizeRows(raw.rows, context, i18n);
  if (
    label === undefined &&
    value === undefined &&
    rows.length === 0
  ) {
    return null;
  }
  return { label, value, rows };
}

function normalizeGroups(
  raw: unknown,
  context: string,
  i18n: I18n,
): NavboxGroup[] {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new NavboxConfigError(
      i18n.t("error.groupsArray", { context }),
    );
  }

  const groups: NavboxGroup[] = [];
  raw.forEach((entry, index) => {
    const group = normalizeGroup(
      entry,
      i18n.t("context.group", { context, index: index + 1 }),
      i18n,
    );
    if (group !== null) {
      groups.push(group);
    }
  });
  return groups;
}

function normalizeSection(
  raw: unknown,
  index: number,
  i18n: I18n,
): NavboxSection | null {
  const context = i18n.t("context.section", { index: index + 1 });
  if (!isRecord(raw)) {
    throw new NavboxConfigError(
      i18n.t("error.sectionObject", { context }),
    );
  }

  const label = readLabel(raw);
  const value = readValue(raw);
  assertScalar(raw.label ?? raw.name ?? raw.title, context, "label", i18n);
  assertScalar(raw.value ?? raw.content ?? raw.text, context, "content", i18n);
  const rows = normalizeRows(raw.rows, context, i18n);
  const groups = normalizeGroups(raw.groups, context, i18n);

  if (
    label === undefined &&
    value === undefined &&
    rows.length === 0 &&
    groups.length === 0
  ) {
    return null;
  }

  return { label, value, rows, groups };
}

function normalizeAccent(
  raw: unknown,
  fallback: AccentName,
): AccentName {
  if (typeof raw !== "string") {
    return fallback;
  }
  const value = raw.trim().toLowerCase();
  return (ACCENT_NAMES as readonly string[]).includes(value)
    ? (value as AccentName)
    : fallback;
}

function normalizeLinks(raw: unknown): NavboxLinks {
  if (!isRecord(raw)) {
    return {};
  }

  const links: NavboxLinks = {};
  for (const key of ["view", "talk", "edit"] as const) {
    const value = raw[key];
    if (value === false || value === true) {
      links[key] = value;
    } else if (typeof value === "string" && value.trim().length > 0) {
      links[key] = value.trim();
    }
  }
  return links;
}

/**
 * Convert the raw YAML object into a predictable model. All user-facing
 * validation errors are thrown as NavboxConfigError so the code block
 * processor can show them inline without breaking the rest of the note.
 */
export function normalizeNavbox(
  raw: unknown,
  options: NormalizeOptions,
): NavboxModel {
  const i18n = createI18n(options.language ?? "zh");

  if (!isRecord(raw)) {
    throw new NavboxConfigError(i18n.t("error.yamlObject"));
  }

  const rawSections = raw.groups ?? raw.sections;
  if (!Array.isArray(rawSections)) {
    throw new NavboxConfigError(i18n.t("error.missingGroups"));
  }

  const sections: NavboxSection[] = [];
  rawSections.forEach((entry, index) => {
    const section = normalizeSection(entry, index, i18n);
    if (section !== null) {
      sections.push(section);
    }
  });

  if (sections.length === 0) {
    throw new NavboxConfigError(i18n.t("error.noSections"));
  }

  const title = readTrimmed(raw.title) ?? i18n.t("navbox.defaultTitle");
  const footer = readTrimmed(raw.footer ?? raw.caption);
  const collapsed =
    typeof raw.collapsed === "boolean" ? raw.collapsed : undefined;

  return {
    title,
    accent: normalizeAccent(raw.accent, options.defaultAccent),
    collapsed,
    dense: raw.dense === true,
    links: normalizeLinks(raw.links),
    footer,
    sections,
  };
}

export function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
