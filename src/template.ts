import type { I18n } from "./i18n";

function quoteYaml(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function buildNavboxTemplate(title: string, i18n: I18n): string {
  const safeTitle =
    title.replace(/[\r\n]+/g, " ").trim() ||
    i18n.t("template.defaultTitle");
  return [
    "```wiki-navbox",
    `title: ${quoteYaml(safeTitle)}`,
    "accent: mint",
    "groups:",
    `  - label: ${quoteYaml(i18n.t("template.overview"))}`,
    "    rows:",
    `      - [${quoteYaml(i18n.t("template.definition"))}, ${quoteYaml(
      i18n.t("template.definitionValue"),
    )}]`,
    `      - [${quoteYaml(i18n.t("template.aliases"))}, ${quoteYaml(
      i18n.t("template.aliasesValue"),
    )}]`,
    `  - label: ${quoteYaml(i18n.t("template.related"))}`,
    "    rows:",
    `      - [${quoteYaml(i18n.t("template.item"))}, ${quoteYaml(
      i18n.t("template.link"),
    )}]`,
    "```",
    "",
  ].join("\n");
}
