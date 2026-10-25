import {
  type App,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";
import {
  ACCENT_NAMES,
  DEFAULT_SETTINGS,
  type AccentName,
  type AppLanguage,
  type NavboxAction,
  type WikiNavboxSettings,
} from "./types";
import {
  createI18nForSetting,
  isAppLanguage,
  type I18n,
} from "./i18n";
import { NavboxRenderChild } from "./render-child";
import { buildNavboxTemplate } from "./template";

export default class WikiNavboxPlugin extends Plugin {
  settings: WikiNavboxSettings = { ...DEFAULT_SETTINGS };

  private readonly navboxChildren = new Set<NavboxRenderChild>();
  private navboxRefreshTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    const i18n = this.getI18n();

    this.registerMarkdownCodeBlockProcessor(
      "wiki-navbox",
      (source, el, ctx) => {
        const child = new NavboxRenderChild(
          {
            app: this.app,
            getSettings: () => this.settings,
            getI18n: () => this.getI18n(),
            onAction: (action, sourcePath) => {
              void this.handleAction(action, sourcePath);
            },
            onOpenLink: (link, sourcePath) => {
              void this.openExplicitLink(link, sourcePath);
            },
            onForget: (renderer) => {
              this.navboxChildren.delete(renderer);
            },
          },
          el,
          source,
          ctx.sourcePath,
        );
        this.navboxChildren.add(child);
        ctx.addChild(child);
        void child.render();
      },
    );

    this.addCommand({
      id: "insert-navbox-template",
      name: i18n.t("command.insert"),
      editorCallback: (editor, view) => {
        const selection = editor.getSelection().trim();
        const title =
          selection.length > 0
            ? selection
            : (view.file?.basename ?? this.getI18n().t("template.defaultTitle"));
        editor.replaceSelection(
          buildNavboxTemplate(title, this.getI18n()),
        );
      },
    });

    this.addCommand({
      id: "toggle-all-navboxes",
      name: i18n.t("command.toggle"),
      callback: () => {
        const current = this.getI18n();
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
          new Notice(current.t("notice.noMarkdown"));
          return;
        }
        const boxes = Array.from(
          view.containerEl.querySelectorAll<HTMLElement>(".wiki-navbox"),
        );
        if (boxes.length === 0) {
          new Notice(current.t("notice.noNavboxes"));
          return;
        }

        const collapse = boxes.some(
          (box) => !box.classList.contains("is-collapsed"),
        );
        let changed = 0;
        for (const box of boxes) {
          const isCollapsed = box.classList.contains("is-collapsed");
          if (isCollapsed === collapse) {
            continue;
          }
          box.querySelector<HTMLButtonElement>(
            ".wiki-navbox__toggle",
          )?.click();
          changed += 1;
        }
        new Notice(
          current.t(collapse ? "notice.collapsed" : "notice.expanded", {
            count: changed,
          }),
        );
      },
    });

    this.addCommand({
      id: "refresh-all-navboxes",
      name: i18n.t("command.refresh"),
      callback: () => {
        const current = this.getI18n();
        const count = this.refreshOpenNavboxes(true);
        new Notice(
          count > 0
            ? current.t("notice.refreshed", { count })
            : current.t("notice.noOpenNavboxes"),
        );
      },
    });

    this.addSettingTab(new WikiNavboxSettingTab(this.app, this));
  }

  onunload(): void {
    if (this.navboxRefreshTimer !== null) {
      window.clearTimeout(this.navboxRefreshTimer);
      this.navboxRefreshTimer = null;
    }
    this.navboxChildren.clear();
  }

  getI18n(): I18n {
    return createI18nForSetting(this.settings.language);
  }

  /**
   * Re-render every mounted navbox after an appearance setting changes.
   * Debounced so dragging a control or flipping several toggles does not queue
   * a full rebuild for each event.
   */
  refreshOpenNavboxes(immediate = false): number {
    if (this.navboxChildren.size === 0) {
      return 0;
    }

    if (this.navboxRefreshTimer !== null) {
      window.clearTimeout(this.navboxRefreshTimer);
      this.navboxRefreshTimer = null;
    }

    if (immediate) {
      return this.rerenderOpenNavboxes();
    }

    this.navboxRefreshTimer = window.setTimeout(() => {
      this.navboxRefreshTimer = null;
      this.rerenderOpenNavboxes();
    }, 60);
    return this.navboxChildren.size;
  }

  private rerenderOpenNavboxes(): number {
    let scheduled = 0;
    for (const child of Array.from(this.navboxChildren)) {
      if (!child.containerEl.isConnected) {
        continue;
      }
      void child.render();
      scheduled += 1;
    }
    return scheduled;
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as
      | Partial<WikiNavboxSettings>
      | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
    if (!ACCENT_NAMES.includes(this.settings.defaultAccent)) {
      this.settings.defaultAccent = DEFAULT_SETTINGS.defaultAccent;
    }
    if (!isAppLanguage(this.settings.language)) {
      this.settings.language = DEFAULT_SETTINGS.language;
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private fileForSourcePath(sourcePath: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (file instanceof TFile) {
      return file;
    }
    return this.app.workspace.getActiveFile();
  }

  private async handleAction(
    action: NavboxAction,
    sourcePath: string,
  ): Promise<void> {
    const i18n = this.getI18n();
    try {
      const file = this.fileForSourcePath(sourcePath);
      if (!file) {
        new Notice(i18n.t("notice.noFile"));
        return;
      }

      if (action === "view") {
        await this.openMarkdown(file, "preview");
      } else if (action === "edit") {
        await this.openMarkdown(file, "source");
      } else {
        await this.openDiscussion(file);
      }
    } catch (error) {
      console.error("Wiki Navbox action failed", error);
      new Notice(
        i18n.t("notice.actionFailed", {
          message:
            error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  private async openMarkdown(
    file: TFile,
    mode: "source" | "preview",
  ): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);

    if (!(leaf.view instanceof MarkdownView)) {
      return;
    }
    const current = leaf.view;
    if (current.getMode() !== mode) {
      await leaf.setViewState({
        type: "markdown",
        state: {
          ...current.getState(),
          file: file.path,
          mode,
        },
      });
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return;
    }
    if (mode === "source") {
      view.editor?.focus();
    } else {
      view.containerEl
        .querySelector<HTMLElement>(".markdown-preview-view")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  private discussionPath(file: TFile, suffix: string): string {
    const parent = file.parent;
    const folder =
      parent !== null && parent.path !== "/" ? parent.path : "";
    return normalizePath(
      `${folder.length > 0 ? `${folder}/` : ""}${file.basename}${suffix}.md`,
    );
  }

  private async openDiscussion(file: TFile): Promise<void> {
    const i18n = this.getI18n();
    const primaryPath = this.discussionPath(
      file,
      i18n.t("talk.suffix"),
    );
    const alternateSuffix =
      i18n.locale === "zh" ? " (discussion)" : "（讨论）";
    const alternatePath = this.discussionPath(file, alternateSuffix);

    for (const path of [primaryPath, alternatePath]) {
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFolder) {
        new Notice(
          i18n.t("notice.talkFolderConflict", { path }),
        );
        return;
      }
    }

    const existingFile =
      [primaryPath, alternatePath]
        .map((path) => this.app.vault.getAbstractFileByPath(path))
        .find((entry): entry is TFile => entry instanceof TFile) ?? null;

    let talk = existingFile;
    if (talk === null) {
      if (!this.settings.createTalkPages) {
        new Notice(i18n.t("notice.talkMissing", { path: primaryPath }));
        return;
      }
      const content = [
        `# ${i18n.t("talk.title", { basename: file.basename })}`,
        "",
        `> ${i18n.t("talk.quote", { basename: file.basename })}`,
        "",
        `## ${i18n.t("talk.topics")}`,
        "",
      ].join("\n");
      talk = await this.app.vault.create(primaryPath, content);
      new Notice(
        i18n.t("notice.talkCreated", { path: primaryPath }),
      );
    }

    await this.app.workspace.getLeaf("tab").openFile(talk);
  }

  private async openExplicitLink(
    link: string,
    sourcePath: string,
  ): Promise<void> {
    try {
      if (/^https?:\/\//i.test(link)) {
        window.open(link, "_blank", "noopener,noreferrer");
        return;
      }
      await this.app.workspace.openLinkText(link, sourcePath, false);
    } catch (error) {
      console.error("Wiki Navbox link failed", error);
      new Notice(
        this.getI18n().t("notice.linkFailed", {
          message:
            error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}

class WikiNavboxSettingTab extends PluginSettingTab {
  private readonly plugin: WikiNavboxPlugin;

  constructor(app: App, plugin: WikiNavboxPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private async updateAppearance(
    patch: Partial<WikiNavboxSettings>,
  ): Promise<void> {
    Object.assign(this.plugin.settings, patch);
    this.plugin.refreshOpenNavboxes();
    await this.plugin.saveSettings();
  }

  private async updateLanguage(value: AppLanguage): Promise<void> {
    this.plugin.settings.language = value;
    await this.plugin.saveSettings();
    this.plugin.refreshOpenNavboxes();
    this.display();
    new Notice(
      this.plugin.getI18n().t("notice.languageChanged"),
    );
  }

  display(): void {
    const { containerEl } = this;
    const i18n = this.plugin.getI18n();
    containerEl.empty();
    containerEl.createEl("h2", { text: i18n.t("settings.title") });
    containerEl.createEl("p", { text: i18n.t("settings.intro") });

    containerEl.createEl("h3", {
      text: i18n.t("settings.general"),
    });

    new Setting(containerEl)
      .setName(i18n.t("settings.language.name"))
      .setDesc(i18n.t("settings.language.desc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("auto", i18n.t("settings.language.auto"))
          .addOption("en", "English")
          .addOption("zh", "简体中文")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            await this.updateLanguage(value as AppLanguage);
          });
      });

    containerEl.createEl("h3", {
      text: i18n.t("settings.appearance"),
    });

    new Setting(containerEl)
      .setName(i18n.t("settings.defaultAccent.name"))
      .setDesc(i18n.t("settings.defaultAccent.desc"))
      .addDropdown((dropdown) => {
        for (const accent of ACCENT_NAMES) {
          dropdown.addOption(accent, i18n.accent(accent));
        }
        dropdown
          .setValue(this.plugin.settings.defaultAccent)
          .onChange(async (value) => {
            await this.updateAppearance({
              defaultAccent: value as AccentName,
            });
          });
      });

    new Setting(containerEl)
      .setName(i18n.t("settings.compact.name"))
      .setDesc(i18n.t("settings.compact.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.compact)
          .onChange(async (value) => {
            await this.updateAppearance({ compact: value });
          }),
      );

    new Setting(containerEl)
      .setName(i18n.t("settings.themeLinks.name"))
      .setDesc(i18n.t("settings.themeLinks.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.themeLinkColor)
          .onChange(async (value) => {
            await this.updateAppearance({ themeLinkColor: value });
          }),
      );

    containerEl.createEl("h3", {
      text: i18n.t("settings.behavior"),
    });

    new Setting(containerEl)
      .setName(i18n.t("settings.defaultCollapsed.name"))
      .setDesc(i18n.t("settings.defaultCollapsed.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.defaultCollapsed)
          .onChange(async (value) => {
            this.plugin.settings.defaultCollapsed = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(i18n.t("settings.showHeaderActions.name"))
      .setDesc(i18n.t("settings.showHeaderActions.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showHeaderActions)
          .onChange(async (value) => {
            await this.updateAppearance({
              showHeaderActions: value,
            });
          }),
      );

    new Setting(containerEl)
      .setName(i18n.t("settings.showTalkAction.name"))
      .setDesc(i18n.t("settings.showTalkAction.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTalkAction)
          .onChange(async (value) => {
            await this.updateAppearance({
              showTalkAction: value,
            });
          }),
      );

    new Setting(containerEl)
      .setName(i18n.t("settings.rememberCollapse.name"))
      .setDesc(i18n.t("settings.rememberCollapse.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.rememberCollapseState)
          .onChange(async (value) => {
            this.plugin.settings.rememberCollapseState = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(i18n.t("settings.createTalk.name"))
      .setDesc(i18n.t("settings.createTalk.desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.createTalkPages)
          .onChange(async (value) => {
            this.plugin.settings.createTalkPages = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", {
      text: i18n.t("settings.help.heading"),
    });
    const details = containerEl.createEl("details");
    details.createEl("summary", {
      text: i18n.t("settings.help.summary"),
    });
    details.createEl("pre", {
      text: i18n.settingsExample.join("\n"),
      cls: "wiki-navbox-settings-code",
    });
    containerEl.createEl("p", {
      text: i18n.t("settings.help.note"),
      cls: "setting-item-description",
    });
    containerEl.createEl("p", {
      text: i18n.t("settings.help.readme"),
      cls: "setting-item-description",
    });
  }
}
