import type {
  AccentName,
  AppLanguage,
  Locale,
  NavboxAction,
} from "./types";

const zh = {
  "settings.title": "Wiki Navbox 设置",
  "settings.intro":
    "在笔记中插入 wiki-navbox 代码块，即可得到类似维基百科的折叠导航表格。",
  "settings.general": "通用",
  "settings.language.name": "语言",
  "settings.language.desc":
    "默认跟随 Obsidian，也可以手动指定插件界面语言。切换后设置页和已打开的导航框立即更新；命令名称需要重载插件后更新。",
  "settings.language.auto": "自动（跟随 Obsidian）",
  "settings.language.en": "English",
  "settings.language.zh": "简体中文",
  "settings.appearance": "外观",
  "settings.defaultAccent.name": "默认配色",
  "settings.defaultAccent.desc":
    "代码块没有写 accent 时使用；代码块里显式写了 accent 时仍以代码块为准。修改后立即刷新已打开的导航框。",
  "settings.compact.name": "紧凑模式",
  "settings.compact.desc":
    "减小单元格内边距和字号，适合大表格。修改后立即生效。",
  "settings.themeLinks.name": "使用主题链接颜色",
  "settings.themeLinks.desc":
    "关闭时使用维基百科风格的红褐色链接。修改后立即生效。",
  "settings.behavior": "行为",
  "settings.defaultCollapsed.name": "默认折叠",
  "settings.defaultCollapsed.desc":
    "单个代码块可以用 collapsed: true / false 覆盖。",
  "settings.showHeaderActions.name": "显示头部操作",
  "settings.showHeaderActions.desc":
    "关闭后标题栏只保留标题和折叠按钮。修改后立即生效。",
  "settings.showTalkAction.name": "显示“论”按钮",
  "settings.showTalkAction.desc":
    "默认关闭，标题栏只显示“查 · 编”。单个代码块可用 links.talk: true 单独开启。修改后立即生效。",
  "settings.rememberCollapse.name": "记住折叠状态",
  "settings.rememberCollapse.desc":
    "按笔记中的代码块分别记住展开 / 折叠状态。",
  "settings.createTalk.name": "自动创建讨论页",
  "settings.createTalk.desc":
    "仅在“论”可用时生效；点击“论”时，若同级目录下没有讨论页则创建它。",
  "settings.help.heading": "配置速查",
  "settings.help.summary": "展开示例",
  "settings.help.note":
    "示例仅演示结构，请把“水果”和条目替换成你的主题。",
  "settings.help.readme":
    "完整字段、两级分组和自定义链接说明见项目 README。",

  "accent.mint": "薄荷绿",
  "accent.sky": "天蓝",
  "accent.lilac": "淡紫",
  "accent.rose": "玫瑰",
  "accent.amber": "琥珀",
  "accent.slate": "石板灰",

  "command.insert": "插入导航框模板",
  "command.toggle": "折叠 / 展开当前笔记中的所有导航框",
  "command.refresh": "刷新所有导航框",

  "notice.noMarkdown": "请先打开一篇 Markdown 笔记。",
  "notice.noNavboxes": "当前笔记中没有导航框。",
  "notice.collapsed": "已折叠 {count} 个导航框。",
  "notice.expanded": "已展开 {count} 个导航框。",
  "notice.refreshed": "已刷新 {count} 个导航框。",
  "notice.noOpenNavboxes": "当前没有已打开的导航框。",
  "notice.noFile": "无法定位当前笔记。",
  "notice.actionFailed": "操作失败：{message}",
  "notice.talkFolderConflict":
    "无法创建讨论页：同名文件夹已存在（{path}）。",
  "notice.talkMissing": "讨论页尚不存在：{path}",
  "notice.talkCreated": "已创建讨论页：{path}",
  "notice.linkFailed": "无法打开链接：{message}",
  "notice.languageChanged":
    "界面语言已切换。重载插件后命令名称会同步更新。",

  "action.view.label": "查",
  "action.view.title": "查看条目",
  "action.talk.label": "论",
  "action.talk.title": "打开或创建讨论页",
  "action.edit.label": "编",
  "action.edit.title": "编辑条目源码",

  "navbox.defaultTitle": "导航框",
  "navbox.caption": "{title} 导航框",
  "navbox.actionsAria": "条目操作",
  "navbox.collapse": "[折叠]",
  "navbox.expand": "[展开]",
  "navbox.collapseAria": "折叠导航框",
  "navbox.expandAria": "展开导航框",

  "error.title": "导航框配置有误",
  "error.hint":
    "最小示例：title: 我的主题 / groups: [{ label: 分类, rows: [[条目, 链接]] }]。完整写法见 README。",
  "error.yamlObject": "代码块内容必须是一个 YAML 对象。",
  "error.missingGroups":
    "缺少 groups 数组。请至少添加一个章节，例如：groups: [{ label: 概述, rows: [...] }]",
  "error.noSections": "groups 中没有可渲染的章节。",
  "error.parse":
    "YAML 解析失败：{detail}。若内容包含 ![[图片]] 或 ![图片](...)，请用双引号包住整段内容。",
  "error.scalar":
    "{context} 的{field}被 YAML 解析成了数组或对象。若内容包含 ![[图片]] 或 ![图片](...)，请用双引号包住整段内容。",
  "error.rowType": "{context} 必须是数组、对象或文本。",
  "error.rowsArray": "{context} 的 rows 必须是数组。",
  "error.groupObject": "{context} 必须是对象。",
  "error.groupsArray": "{context} 的 groups 必须是数组。",
  "error.nestedGroups":
    "导航框只支持两级分组：章节（groups）→ 分组（groups）→ 行；不能在分组内继续嵌套 groups。",
  "error.sectionObject": "{context} 必须是对象。",
  "error.field.label": "标签",
  "error.field.content": "内容",
  "context.section": "第 {index} 个章节",
  "context.group": "{context} 的第 {index} 个分组",
  "context.row": "{context} 的第 {index} 行",

  "talk.suffix": "（讨论）",
  "talk.title": "{basename} · 讨论",
  "talk.quote": "本页用于讨论 [[{basename}]] 的内容。",
  "talk.topics": "议题",

  "template.defaultTitle": "我的主题",
  "template.overview": "概述",
  "template.definition": "定义",
  "template.definitionValue": "在这里写一句话说明这个主题。",
  "template.aliases": "别名",
  "template.aliasesValue": "用“、”分隔。",
  "template.related": "相关条目",
  "template.item": "条目",
  "template.link": "[[相关笔记]]",
} as const;

type MessageKey = keyof typeof zh;

const en: Record<MessageKey, string> = {
  "settings.title": "Wiki Navbox Settings",
  "settings.intro":
    "Add a wiki-navbox code block to any note to render a collapsible, Wikipedia-style navigation table.",
  "settings.general": "General",
  "settings.language.name": "Language",
  "settings.language.desc":
    "Follow Obsidian or choose the interface language. The settings page and open navboxes update immediately; command names update after reloading the plugin.",
  "settings.language.auto": "Auto (Follow Obsidian)",
  "settings.language.en": "English",
  "settings.language.zh": "简体中文",
  "settings.appearance": "Appearance",
  "settings.defaultAccent.name": "Default accent",
  "settings.defaultAccent.desc":
    "Used when a code block does not set accent. A block-level accent still takes precedence. Open navboxes refresh immediately.",
  "settings.compact.name": "Compact mode",
  "settings.compact.desc":
    "Reduce cell padding and font size for large tables. Applies immediately.",
  "settings.themeLinks.name": "Use theme link color",
  "settings.themeLinks.desc":
    "Off uses the wiki-style muted red link color. Applies immediately.",
  "settings.behavior": "Behavior",
  "settings.defaultCollapsed.name": "Start collapsed",
  "settings.defaultCollapsed.desc":
    "A block can override this with collapsed: true / false.",
  "settings.showHeaderActions.name": "Show header actions",
  "settings.showHeaderActions.desc":
    "When off, only the title and collapse button remain. Applies immediately.",
  "settings.showTalkAction.name": "Show Talk button",
  "settings.showTalkAction.desc":
    "Off by default; the header shows View · Edit. A single block can opt in with links.talk: true. Applies immediately.",
  "settings.rememberCollapse.name": "Remember collapse state",
  "settings.rememberCollapse.desc":
    "Remember the expanded / collapsed state per code block in localStorage.",
  "settings.createTalk.name": "Create discussion pages automatically",
  "settings.createTalk.desc":
    "Only applies when Talk is enabled. Clicking Talk creates a sibling discussion page if it does not exist.",
  "settings.help.heading": "Quick reference",
  "settings.help.summary": "Show example",
  "settings.help.note":
    "The example only demonstrates the structure; replace “Fruit” and its entries with your own topic.",
  "settings.help.readme":
    "See the README for all fields, two-level groups, and custom links.",

  "accent.mint": "Mint",
  "accent.sky": "Sky",
  "accent.lilac": "Lilac",
  "accent.rose": "Rose",
  "accent.amber": "Amber",
  "accent.slate": "Slate",

  "command.insert": "Insert navbox template",
  "command.toggle": "Collapse / expand all navboxes in this note",
  "command.refresh": "Refresh all navboxes",

  "notice.noMarkdown": "Open a Markdown note first.",
  "notice.noNavboxes": "There are no navboxes in the current note.",
  "notice.collapsed": "Collapsed {count} navbox(es).",
  "notice.expanded": "Expanded {count} navbox(es).",
  "notice.refreshed": "Refreshed {count} navbox(es).",
  "notice.noOpenNavboxes": "There are no open navboxes.",
  "notice.noFile": "Could not locate the current note.",
  "notice.actionFailed": "Action failed: {message}",
  "notice.talkFolderConflict":
    "Could not create the discussion page: a folder with that name already exists ({path}).",
  "notice.talkMissing": "Discussion page does not exist: {path}",
  "notice.talkCreated": "Created discussion page: {path}",
  "notice.linkFailed": "Could not open link: {message}",
  "notice.languageChanged":
    "Interface language updated. Reload the plugin to update command names.",

  "action.view.label": "View",
  "action.view.title": "View note",
  "action.talk.label": "Talk",
  "action.talk.title": "Open or create talk page",
  "action.edit.label": "Edit",
  "action.edit.title": "Edit note source",

  "navbox.defaultTitle": "Navbox",
  "navbox.caption": "{title} navbox",
  "navbox.actionsAria": "Page actions",
  "navbox.collapse": "[Collapse]",
  "navbox.expand": "[Expand]",
  "navbox.collapseAria": "Collapse navbox",
  "navbox.expandAria": "Expand navbox",

  "error.title": "Invalid navbox configuration",
  "error.hint":
    "Minimal example: title: My topic / groups: [{ label: Category, rows: [[Item, link]] }]. See README for the full syntax.",
  "error.yamlObject": "The code block must contain a YAML object.",
  "error.missingGroups":
    "Missing the groups array. Add at least one section, e.g. groups: [{ label: Overview, rows: [...] }]",
  "error.noSections": "No renderable sections found in groups.",
  "error.parse":
    "YAML parsing failed: {detail}. If the content contains ![[image]] or ![image](...), wrap the entire value in double quotes.",
  "error.scalar":
    "{context} {field} was parsed as an array or object. If it contains ![[image]] or ![image](...), wrap the entire value in double quotes.",
  "error.rowType": "{context} must be an array, object, or text.",
  "error.rowsArray": "rows in {context} must be an array.",
  "error.groupObject": "{context} must be an object.",
  "error.groupsArray": "groups in {context} must be an array.",
  "error.nestedGroups":
    "Only two levels of groups are supported: section → group → rows. Nested groups inside a group are not allowed.",
  "error.sectionObject": "{context} must be an object.",
  "error.field.label": "label",
  "error.field.content": "content",
  "context.section": "Section {index}",
  "context.group": "Group {index} in {context}",
  "context.row": "Row {index} in {context}",

  "talk.suffix": " (discussion)",
  "talk.title": "{basename} · Discussion",
  "talk.quote": "This page is for discussing [[{basename}]].",
  "talk.topics": "Topics",

  "template.defaultTitle": "My topic",
  "template.overview": "Overview",
  "template.definition": "Definition",
  "template.definitionValue": "Write a one-line description of this topic.",
  "template.aliases": "Aliases",
  "template.aliasesValue": "Separate with commas.",
  "template.related": "Related",
  "template.item": "Item",
  "template.link": "[[Related note]]",
};

const settingsExampleZh = [
  "```wiki-navbox",
  "title: 水果",
  "accent: mint",
  "groups:",
  "  - label: 基本信息",
  "    rows:",
  "      - [定义, 可食用的植物果实]",
  "      - [常见种类, \"[[苹果]]、[[香蕉]]、[[橙子]]\"]",
  "",
  "  - label: 品种示例",
  "    groups:",
  "      - label: 苹果",
  "        rows:",
  "          - [口感, 清脆、多汁]",
  "          - [常见品种, 红富士、嘎啦]",
  "```",
];

const settingsExampleEn = [
  "```wiki-navbox",
  "title: Fruit",
  "accent: mint",
  "groups:",
  "  - label: Basic info",
  "    rows:",
  "      - [Definition, \"A fruit commonly eaten as food.\"]",
  "      - [Common types, \"[[Apple]], [[Banana]], [[Orange]]\"]",
  "",
  "  - label: Varieties",
  "    groups:",
  "      - label: Apple",
  "        rows:",
  "          - [Texture, \"Crisp and juicy\"]",
  "          - [Common varieties, \"Fuji, Gala\"]",
  "```",
];

const errorSnippetZh = [
  "```wiki-navbox",
  "title: 我的主题",
  "groups:",
  "  - label: 分类",
  "    rows:",
  "      - [条目, \"[[相关笔记]]\"]",
  "```",
];

const errorSnippetEn = [
  "```wiki-navbox",
  "title: My topic",
  "groups:",
  "  - label: Category",
  "    rows:",
  "      - [Item, \"[[Related note]]\"]",
  "```",
];

export interface I18n {
  readonly locale: Locale;
  readonly settingsExample: string[];
  readonly errorSnippet: string[];
  t(key: MessageKey, params?: Record<string, string | number>): string;
  action(action: NavboxAction): { label: string; title: string };
  accent(accent: AccentName): string;
}

function format(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export function createI18n(locale: Locale): I18n {
  const messages = locale === "en" ? en : zh;
  const t = (
    key: MessageKey,
    params?: Record<string, string | number>,
  ): string => format(messages[key], params);

  return {
    locale,
    settingsExample:
      locale === "en" ? settingsExampleEn : settingsExampleZh,
    errorSnippet: locale === "en" ? errorSnippetEn : errorSnippetZh,
    t,
    action(action) {
      return {
        label: t(`action.${action}.label` as MessageKey),
        title: t(`action.${action}.title` as MessageKey),
      };
    },
    accent(accent) {
      return t(`accent.${accent}` as MessageKey);
    },
  };
}

function languageFromCode(code: string | null | undefined): Locale | undefined {
  const value = code?.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value.startsWith("zh")) {
    return "zh";
  }
  if (value.startsWith("en")) {
    return "en";
  }
  return undefined;
}

export function resolveLocale(setting: AppLanguage): Locale {
  if (setting === "zh" || setting === "en") {
    return setting;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = languageFromCode(
        window.localStorage.getItem("language"),
      );
      if (stored) {
        return stored;
      }
    } catch {
      // localStorage can be unavailable in restricted environments.
    }
    const html = languageFromCode(document.documentElement.lang);
    if (html) {
      return html;
    }
  }

  if (typeof navigator !== "undefined") {
    const navigatorLocale = languageFromCode(navigator.language);
    if (navigatorLocale) {
      return navigatorLocale;
    }
  }

  return "en";
}

export function createI18nForSetting(setting: AppLanguage): I18n {
  return createI18n(resolveLocale(setting));
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "auto" || value === "zh" || value === "en";
}
