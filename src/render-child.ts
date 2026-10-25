import {
  Component,
  MarkdownRenderChild,
  MarkdownRenderer,
  type App,
  parseYaml,
} from "obsidian";
import {
  hashString,
  isRecord,
  normalizeNavbox,
  NavboxConfigError,
} from "./model";
import { renderNavbox, renderNavboxError } from "./render";
import type { I18n } from "./i18n";
import type {
  NavboxAction,
  WikiNavboxSettings,
} from "./types";

export interface NavboxHost {
  app: App;
  getSettings(): WikiNavboxSettings;
  getI18n(): I18n;
  onAction(action: NavboxAction, sourcePath: string): void;
  onOpenLink(link: string, sourcePath: string): void;
  onForget(child: NavboxRenderChild): void;
}

/**
 * A single rendered wiki-navbox code block. Keeping a class per block lets the
 * plugin re-run the render pipeline in place when appearance settings change,
 * without forcing Obsidian to rebuild the whole note.
 */
export class NavboxRenderChild extends MarkdownRenderChild {
  private markdownComponent: Component | null = null;
  private rendering = false;
  private queued = false;
  private unloaded = false;

  constructor(
    private readonly host: NavboxHost,
    containerEl: HTMLElement,
    private readonly source: string,
    private readonly sourcePath: string,
  ) {
    super(containerEl);
  }

  /**
   * Re-render this block. Calls made while a render is in flight are coalesced
   * into one follow-up render so rapid setting changes cannot interleave DOM.
   */
  async render(): Promise<void> {
    if (this.unloaded) {
      return;
    }
    this.load();
    if (this.rendering) {
      this.queued = true;
      return;
    }

    this.rendering = true;
    try {
      await this.performRender();
    } catch (error) {
      console.error("Wiki Navbox: failed to render block", error);
      if (!this.unloaded) {
        this.releaseMarkdownComponent();
        renderNavboxError(this.containerEl, error, this.host.getI18n());
      }
    } finally {
      this.rendering = false;
      if (this.queued && !this.unloaded) {
        this.queued = false;
        void this.render();
      }
    }
  }

  onunload(): void {
    this.unloaded = true;
    this.queued = false;
    this.releaseMarkdownComponent();
    this.host.onForget(this);
    super.onunload();
  }

  private async performRender(): Promise<void> {
    this.releaseMarkdownComponent();

    // Render into a hidden staging element, then swap it in. This keeps the
    // old table visible while links and Markdown are being resolved.
    const staging = document.createElement("div");
    staging.className = "wiki-navbox__staging";
    staging.hidden = true;
    this.containerEl.appendChild(staging);
    const i18n = this.host.getI18n();

    try {
      if (this.unloaded) {
        return;
      }

      let parsed: unknown;
      try {
        parsed = parseYaml(this.source);
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : String(error);
        throw new NavboxConfigError(
          i18n.t("error.parse", { detail }),
        );
      }
      if (!isRecord(parsed)) {
        throw new NavboxConfigError(i18n.t("error.yamlObject"));
      }

      const settings = { ...this.host.getSettings() };
      const model = normalizeNavbox(parsed, {
        defaultAccent: settings.defaultAccent,
        language: i18n.locale,
      });
      const storageKey = [
        this.sourcePath,
        hashString(this.source),
        hashString(model.title),
      ].join(":");

      const markdownComponent = new Component();
      this.markdownComponent = markdownComponent;
      this.addChild(markdownComponent);

      if (this.unloaded) {
        return;
      }

      await renderNavbox(staging, model, {
        sourcePath: this.sourcePath,
        settings,
        i18n,
        storageKey,
        renderMarkdown: (target, markdown, sourcePath) =>
          MarkdownRenderer.render(
            this.host.app,
            markdown,
            target,
            sourcePath,
            markdownComponent,
          ),
        onAction: (action) => {
          this.host.onAction(action, this.sourcePath);
        },
        onOpenLink: (link) => {
          this.host.onOpenLink(link, this.sourcePath);
        },
      });

      if (this.unloaded) {
        return;
      }
      this.swapStaging(staging);
    } catch (error) {
      if (this.unloaded) {
        return;
      }
      this.releaseMarkdownComponent();
      renderNavboxError(staging, error, i18n);
      this.swapStaging(staging);
    }
  }

  private swapStaging(staging: HTMLElement): void {
    const nodes = Array.from(staging.childNodes);
    this.containerEl.replaceChildren(...nodes);
  }

  private releaseMarkdownComponent(): void {
    const component = this.markdownComponent;
    this.markdownComponent = null;
    if (component !== null) {
      this.removeChild(component);
    }
  }
}
