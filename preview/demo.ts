import { createI18n } from "../src/i18n";
import { normalizeNavbox } from "../src/model";
import { renderNavbox } from "../src/render";
import type { Locale, WikiNavboxSettings } from "../src/types";

const lang: Locale =
  document.body.dataset.lang === "en" ||
  new URLSearchParams(window.location.search).get("lang") === "en"
    ? "en"
    : "zh";
const i18n = createI18n(lang);

const settings: WikiNavboxSettings = {
  language: lang,
  defaultAccent: "mint",
  defaultCollapsed: false,
  showHeaderActions: true,
  showTalkAction: false,
  rememberCollapseState: false,
  createTalkPages: true,
  compact: false,
  themeLinkColor: false,
};

const dataZh = {
  title: "[[水果]]",
  accent: "mint",
  groups: [
    {
      label: "基本信息",
      rows: [
        ["定义", "日常食用的植物果实"],
        ["常见种类", "[[苹果]]、[[香蕉]]、[[橙子]]"],
      ],
    },
    {
      label: "品种示例",
      groups: [
        {
          label: "[[苹果]]",
          rows: [
            ["[[红富士]]", "清脆、多汁"],
            ["[[嘎啦]]", "酸甜、较早熟"],
            ["[[青苹果]]", "偏酸、口感爽脆"],
          ],
        },
        {
          label: "外观",
          value: "圆形，果皮多为红色、绿色或黄色",
        },
      ],
    },
    {
      label: "用途",
      rows: [
        ["直接食用", "零食、水果沙拉"],
        ["烹饪", "果派、果酱、蜜饯"],
        ["储存", "阴凉干燥处或冰箱"],
      ],
    },
  ],
};

const dataEn = {
  title: "[[Fruit]]",
  accent: "mint",
  groups: [
    {
      label: "Basic info",
      rows: [
        ["Definition", "A fruit commonly eaten as food"],
        ["Common types", "[[Apple]], [[Banana]], [[Orange]]"],
      ],
    },
    {
      label: "Varieties",
      groups: [
        {
          label: "[[Apple]]",
          rows: [
            ["[[Fuji]]", "Crisp and sweet"],
            ["[[Gala]]", "Sweet and mild"],
            ["[[Granny Smith]]", "Tart and firm"],
          ],
        },
        {
          label: "Appearance",
          value: "Round fruit, usually red, green, or yellow",
        },
      ],
    },
    {
      label: "Uses",
      rows: [
        ["Fresh eating", "Snack, fruit salad"],
        ["Cooking", "Pies, sauces, preserves"],
        ["Storage", "Cool, dry place or refrigerator"],
      ],
    },
  ],
};

const data = lang === "en" ? dataEn : dataZh;

function inlineMarkdown(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const pattern =
    /\[\[([^\]]+?)\]\]|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      fragment.appendChild(
        document.createTextNode(text.slice(cursor, match.index)),
      );
    }

    if (match[1] !== undefined) {
      const [target, ...aliasParts] = match[1].split("|");
      const anchor = document.createElement("a");
      anchor.className = "internal-link";
      anchor.href = "#";
      anchor.textContent = aliasParts.length > 0 ? aliasParts.join("|") : target;
      anchor.dataset.href = target;
      fragment.appendChild(anchor);
    } else if (match[2] !== undefined) {
      const anchor = document.createElement("a");
      anchor.className = "external-link";
      anchor.href = match[3];
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[2];
      fragment.appendChild(anchor);
    } else if (match[4] !== undefined) {
      const code = document.createElement("code");
      code.textContent = match[4];
      fragment.appendChild(code);
    } else if (match[5] !== undefined) {
      const strong = document.createElement("strong");
      strong.textContent = match[5];
      fragment.appendChild(strong);
    }
    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }
  return fragment;
}

async function mockRenderMarkdown(
  target: HTMLElement,
  markdown: string,
): Promise<void> {
  target.replaceChildren();
  const paragraphs = markdown.split(/\n{2,}/);
  for (const paragraph of paragraphs) {
    const p = document.createElement("p");
    p.appendChild(inlineMarkdown(paragraph));
    target.appendChild(p);
  }
}

function toast(message: string): void {
  const el = document.getElementById("demo-toast");
  if (!el) {
    return;
  }
  el.textContent = message;
  el.classList.add("is-visible");
  window.setTimeout(() => el.classList.remove("is-visible"), 1800);
}

const model = normalizeNavbox(data, {
  defaultAccent: "mint",
  language: lang,
});

for (const [id, suffix] of [
  ["light", "light"],
  ["dark", "dark"],
] as const) {
  const host = document.getElementById(id);
  if (!host) {
    continue;
  }
  void renderNavbox(host, model, {
    sourcePath: lang === "en" ? "Fruit.md" : "水果.md",
    settings,
    i18n,
    storageKey: `preview-${suffix}`,
    renderMarkdown: mockRenderMarkdown,
    onAction: (action) => {
      if (lang === "en") {
        toast(
          action === "view"
            ? "View: opens this note in reading view"
            : action === "talk"
              ? "Talk: opens or creates the discussion page"
              : "Edit: opens this note in source mode",
        );
        return;
      }
      toast(
        action === "view"
          ? "查：在 Obsidian 中会打开当前笔记的阅读视图"
          : action === "talk"
            ? "论：会打开或创建《水果（讨论）》"
            : "编：会切到当前笔记的源码编辑模式",
      );
    },
    onOpenLink: (link) =>
      toast(lang === "en" ? `Open internal link: ${link}` : `打开内部链接：${link}`),
  });
}

const view = new URLSearchParams(window.location.search).get("theme");
if (view === "light" || view === "dark") {
  document.body.dataset.view = view;
}
