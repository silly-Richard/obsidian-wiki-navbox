import type {
  NavboxAction,
  NavboxGroup,
  NavboxModel,
  NavboxRow,
  NavboxSection,
  WikiNavboxSettings,
} from "./types";
import type { I18n } from "./i18n";

export interface RenderDeps {
  sourcePath: string;
  settings: WikiNavboxSettings;
  i18n: I18n;
  storageKey: string;
  renderMarkdown: (
    target: HTMLElement,
    markdown: string,
    sourcePath: string,
  ) => Promise<void>;
  onAction: (action: NavboxAction) => void;
  onOpenLink: (link: string) => void;
}

const STORAGE_PREFIX = "wiki-navbox:collapsed:";
let instanceCounter = 0;

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (parent) {
    parent.appendChild(element);
  }
  return element;
}

function addCell(
  row: HTMLTableRowElement,
  tag: "th" | "td",
  className: string,
  colspan = 1,
  rowspan = 1,
): HTMLTableCellElement {
  const cell = document.createElement(tag);
  cell.className = className;
  cell.colSpan = colspan;
  cell.rowSpan = rowspan;
  if (tag === "th") {
    cell.scope = rowspan > 1 ? "rowgroup" : "row";
  }
  row.appendChild(cell);
  return cell;
}

function groupEntryCount(group: NavboxGroup): number {
  return Math.max(1, group.rows.length + (group.value ? 1 : 0));
}

function sectionEntryCount(section: NavboxSection): number {
  const direct =
    section.rows.length + (section.value ? 1 : 0);
  const nested = section.groups.reduce(
    (total, group) => total + groupEntryCount(group),
    0,
  );
  return Math.max(1, direct + nested);
}

function plainTitle(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) =>
      typeof label === "string" ? label : target,
    )
    .replace(/[*_`#>]/g, "")
    .trim();
}

function readStoredCollapse(key: string): boolean | undefined {
  if (!key) {
    return undefined;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (value === "1") {
      return true;
    }
    if (value === "0") {
      return false;
    }
  } catch {
    // Storage can be unavailable in restricted environments.
  }
  return undefined;
}

function writeStoredCollapse(key: string, collapsed: boolean): void {
  if (!key) {
    return;
  }
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + key,
      collapsed ? "1" : "0",
    );
  } catch {
    // Ignore storage failures; collapsing still works for this session.
  }
}

function createAction(
  action: NavboxAction,
  model: NavboxModel,
  deps: RenderDeps,
): HTMLElement | null {
  const link = model.links[action];
  if (link === false) {
    return null;
  }
  if (
    action === "talk" &&
    link === undefined &&
    !deps.settings.showTalkAction
  ) {
    return null;
  }

  const label = deps.i18n.action(action);
  const title = label.title;
  const labelText = label.label;

  if (typeof link === "string") {
    const isExternal = /^(?:https?:\/\/|mailto:)/i.test(link);
    if (isExternal) {
      const anchor = make("a", "wiki-navbox__action");
      anchor.textContent = labelText;
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.title = title;
      anchor.setAttribute("aria-label", `${labelText}: ${title}`);
      return anchor;
    }

    const anchor = make("a", "wiki-navbox__action");
    anchor.textContent = labelText;
    anchor.href = "#";
    anchor.title = title;
    anchor.setAttribute("aria-label", `${labelText}: ${title}`);
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      deps.onOpenLink(link);
    });
    return anchor;
  }

  const button = make("button", "wiki-navbox__action");
  button.type = "button";
  button.textContent = labelText;
  button.title = title;
  button.setAttribute("aria-label", `${labelText}: ${title}`);
  button.addEventListener("click", () => deps.onAction(action));
  return button;
}

function appendMarkdown(
  target: HTMLElement,
  markdown: string | undefined,
  deps: RenderDeps,
  tasks: Promise<void>[],
): void {
  if (!markdown || markdown.trim().length === 0) {
    return;
  }
  const wrapper = make("div", "wiki-navbox__md", target);
  const task = deps
    .renderMarkdown(wrapper, markdown, deps.sourcePath)
    .catch((error: unknown) => {
      console.error("Wiki Navbox: failed to render markdown", error);
      wrapper.textContent = markdown;
    });
  tasks.push(task);
}

function addDirectRow(
  row: HTMLTableRowElement,
  config: NavboxRow,
  deps: RenderDeps,
  tasks: Promise<void>[],
): void {
  if (config.label !== undefined) {
    const label = addCell(row, "th", "wiki-navbox__key");
    appendMarkdown(label, config.label, deps, tasks);
    const value = addCell(row, "td", "wiki-navbox__value", 2);
    appendMarkdown(value, config.value, deps, tasks);
    return;
  }

  const value = addCell(row, "td", "wiki-navbox__value", 3);
  appendMarkdown(value, config.value, deps, tasks);
}

function addGroupRows(
  group: NavboxGroup,
  startRow: () => HTMLTableRowElement,
  deps: RenderDeps,
  tasks: Promise<void>[],
): void {
  const count = groupEntryCount(group);

  if (group.rows.length === 0) {
    const row = startRow();
    const label = addCell(row, "th", "wiki-navbox__group", 2);
    appendMarkdown(label, group.label, deps, tasks);
    const value = addCell(row, "td", "wiki-navbox__value");
    appendMarkdown(value, group.value, deps, tasks);
    return;
  }

  let groupCellAdded = false;
  const ensureGroupCell = (row: HTMLTableRowElement): void => {
    if (groupCellAdded) {
      return;
    }
    const label = addCell(row, "th", "wiki-navbox__group", 1, count);
    appendMarkdown(label, group.label, deps, tasks);
    groupCellAdded = true;
  };

  if (group.value) {
    const row = startRow();
    ensureGroupCell(row);
    const value = addCell(row, "td", "wiki-navbox__value", 2);
    appendMarkdown(value, group.value, deps, tasks);
  }

  for (const config of group.rows) {
    const row = startRow();
    ensureGroupCell(row);
    if (config.label !== undefined) {
      const label = addCell(row, "th", "wiki-navbox__key");
      appendMarkdown(label, config.label, deps, tasks);
      const value = addCell(row, "td", "wiki-navbox__value");
      appendMarkdown(value, config.value, deps, tasks);
    } else {
      const value = addCell(row, "td", "wiki-navbox__value", 2);
      appendMarkdown(value, config.value, deps, tasks);
    }
  }
}

function buildTable(
  model: NavboxModel,
  deps: RenderDeps,
  tasks: Promise<void>[],
): HTMLTableElement {
  const table = make("table", "wiki-navbox__table");
  const caption = make("caption", "wiki-navbox__sr-only", table);
  caption.textContent = deps.i18n.t("navbox.caption", {
    title: plainTitle(model.title),
  });

  const colgroup = make("colgroup", undefined, table);
  for (const width of ["11%", "34%", "18%", "37%"]) {
    const col = make("col", undefined, colgroup);
    col.style.width = width;
  }

  const tbody = make("tbody", undefined, table);

  for (const section of model.sections) {
    const span = sectionEntryCount(section);
    let sectionCell: HTMLTableCellElement | null = null;

    const startRow = (): HTMLTableRowElement => {
      const row = make("tr", undefined, tbody);
      if (sectionCell === null) {
        sectionCell = addCell(
          row,
          "th",
          "wiki-navbox__section",
          1,
          span,
        );
        sectionCell.scope = "rowgroup";
        appendMarkdown(sectionCell, section.label, deps, tasks);
      }
      return row;
    };

    if (section.value) {
      const row = startRow();
      const value = addCell(
        row,
        "td",
        "wiki-navbox__value",
        3,
      );
      appendMarkdown(value, section.value, deps, tasks);
    }

    for (const config of section.rows) {
      addDirectRow(startRow(), config, deps, tasks);
    }

    for (const group of section.groups) {
      addGroupRows(group, startRow, deps, tasks);
    }

    if (sectionCell === null) {
      const row = startRow();
      const value = addCell(
        row,
        "td",
        "wiki-navbox__value wiki-navbox__value--empty",
        3,
      );
      value.textContent = "—";
    }
  }

  return table;
}

function applyCollapsedState(
  root: HTMLElement,
  body: HTMLElement,
  toggle: HTMLButtonElement,
  collapsed: boolean,
  i18n: I18n,
): void {
  root.classList.toggle("is-collapsed", collapsed);
  body.hidden = collapsed;
  toggle.textContent = collapsed
    ? i18n.t("navbox.expand")
    : i18n.t("navbox.collapse");
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute(
    "aria-label",
    collapsed
      ? i18n.t("navbox.expandAria")
      : i18n.t("navbox.collapseAria"),
  );
  toggle.title = collapsed
    ? i18n.t("navbox.expandAria")
    : i18n.t("navbox.collapseAria");
}

/**
 * Render a complete navbox into the provided element. Markdown is rendered
 * through the supplied callback so the renderer itself stays independent of
 * the Obsidian runtime (and can be previewed in a plain browser).
 */
export async function renderNavbox(
  container: HTMLElement,
  model: NavboxModel,
  deps: RenderDeps,
): Promise<void> {
  container.replaceChildren();

  const root = make("div", "wiki-navbox", container);
  root.classList.add(`wiki-navbox--accent-${model.accent}`);
  if (model.dense || deps.settings.compact) {
    root.classList.add("wiki-navbox--compact");
  }
  if (deps.settings.themeLinkColor) {
    root.classList.add("wiki-navbox--theme-links");
  }
  root.setAttribute("data-accent", model.accent);
  root.setAttribute("role", "group");
  root.setAttribute(
    "aria-label",
    deps.i18n.t("navbox.caption", {
      title: plainTitle(model.title),
    }),
  );

  const header = make("div", "wiki-navbox__header", root);
  const actions = make("div", "wiki-navbox__actions", header);
  actions.setAttribute("aria-label", deps.i18n.t("navbox.actionsAria"));

  if (deps.settings.showHeaderActions) {
    let actionCount = 0;
    for (const action of ["view", "talk", "edit"] as const) {
      const element = createAction(action, model, deps);
      if (element === null) {
        continue;
      }
      if (actionCount > 0) {
        const separator = make("span", "wiki-navbox__separator", actions);
        separator.textContent = "·";
        separator.setAttribute("aria-hidden", "true");
      }
      actions.appendChild(element);
      actionCount += 1;
    }
  }

  const title = make("div", "wiki-navbox__title", header);
  title.setAttribute("role", "heading");
  title.setAttribute("aria-level", "3");

  const tasks: Promise<void>[] = [];
  appendMarkdown(title, model.title, deps, tasks);

  const bodyId = `wiki-navbox-body-${instanceCounter}`;
  instanceCounter += 1;

  const toggle = make("button", "wiki-navbox__toggle", header);
  toggle.type = "button";
  toggle.setAttribute("aria-controls", bodyId);

  const body = make("div", "wiki-navbox__body", root);
  body.id = bodyId;

  const stored =
    deps.settings.rememberCollapseState && model.collapsed === undefined
      ? readStoredCollapse(deps.storageKey)
      : undefined;
  let collapsed = model.collapsed ?? stored ?? deps.settings.defaultCollapsed;
  applyCollapsedState(root, body, toggle, collapsed, deps.i18n);

  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    applyCollapsedState(root, body, toggle, collapsed, deps.i18n);
    if (deps.settings.rememberCollapseState) {
      writeStoredCollapse(deps.storageKey, collapsed);
    }
  });

  const scroll = make("div", "wiki-navbox__scroll", body);
  scroll.appendChild(buildTable(model, deps, tasks));

  if (model.footer) {
    const footer = make("div", "wiki-navbox__footer", body);
    appendMarkdown(footer, model.footer, deps, tasks);
  }

  await Promise.all(tasks);
}

export function renderNavboxError(
  container: HTMLElement,
  error: unknown,
  i18n: I18n,
): void {
  container.replaceChildren();
  const root = make("div", "wiki-navbox wiki-navbox--error", container);
  root.setAttribute("role", "alert");

  const title = make("div", "wiki-navbox__error-title", root);
  title.textContent = i18n.t("error.title");

  const message = make("div", "wiki-navbox__error-message", root);
  message.textContent =
    error instanceof Error ? error.message : String(error);

  const hint = make("div", "wiki-navbox__error-hint", root);
  hint.textContent = i18n.t("error.hint");

  const snippet = make("pre", "wiki-navbox__error-code", root);
  snippet.textContent = i18n.errorSnippet.join("\n");
}
