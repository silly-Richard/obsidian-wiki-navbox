import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load as loadYaml } from "js-yaml";
import {
  hashString,
  NavboxConfigError,
  normalizeNavbox,
} from "../.test/model.mjs";
import {
  createI18n,
  isAppLanguage,
  resolveLocale,
} from "../.test/i18n.mjs";

const options = { defaultAccent: "mint" };

test("normalizes direct rows, object rows and value-only rows", () => {
  const model = normalizeNavbox(
    {
      title: "测试主题",
      groups: [
        {
          label: "章节",
          rows: [
            ["标签", "[[链接]]"],
            { value: "没有标签的内容" },
            "纯文本内容",
          ],
        },
      ],
    },
    options,
  );

  assert.equal(model.title, "测试主题");
  assert.equal(model.sections.length, 1);
  assert.equal(model.sections[0].rows.length, 3);
  assert.deepEqual(model.sections[0].rows[0], {
    label: "标签",
    value: "[[链接]]",
  });
  assert.equal(model.sections[0].rows[1].label, undefined);
  assert.equal(model.sections[0].rows[2].value, "纯文本内容");
});

test("normalizes two-level groups", () => {
  const model = normalizeNavbox(
    {
      title: "水果",
      groups: [
        {
          label: "品种示例",
          groups: [
            {
              label: "苹果",
              rows: [["红富士", "/"]],
            },
            {
              label: "外观",
              value: "圆形，红色",
            },
          ],
        },
      ],
    },
    options,
  );

  const section = model.sections[0];
  assert.equal(section.groups.length, 2);
  assert.equal(section.groups[0].rows.length, 1);
  assert.equal(section.groups[1].value, "圆形，红色");
  assert.equal(section.groups[1].rows.length, 0);
});

test("supports sections alias, custom links and explicit collapse state", () => {
  const model = normalizeNavbox(
    {
      title: "T",
      collapsed: true,
      sections: [
        {
          label: "S",
          rows: [["A", "B"]],
        },
      ],
      links: {
        view: "T",
        talk: false,
        edit: "https://example.com/edit",
        unknown: "ignored",
      },
    },
    options,
  );

  assert.equal(model.collapsed, true);
  assert.equal(model.links.view, "T");
  assert.equal(model.links.talk, false);
  assert.equal(model.links.edit, "https://example.com/edit");
});

test("preserves boolean link overrides", () => {
  const model = normalizeNavbox(
    {
      title: "T",
      groups: [{ label: "S", rows: [["A", "B"]] }],
      links: {
        view: true,
        talk: true,
        edit: false,
      },
    },
    options,
  );

  assert.equal(model.links.view, true);
  assert.equal(model.links.talk, true);
  assert.equal(model.links.edit, false);
});

test("accepts quoted wikilink and Markdown image syntax", () => {
  const model = normalizeNavbox(
    {
      title: "T",
      groups: [
        {
          label: "S",
          rows: [
            ["Wiki 图片", "![[image.png]]"],
            ["Markdown 图片", "![alt](image.png)"],
          ],
        },
      ],
    },
    options,
  );

  assert.equal(model.sections[0].rows[0].value, "![[image.png]]");
  assert.equal(model.sections[0].rows[1].value, "![alt](image.png)");
});

test("rejects unquoted image syntax parsed as a nested array", () => {
  assert.throws(
    () =>
      normalizeNavbox(
        {
          title: "T",
          groups: [
            {
              label: "S",
              rows: [["图片", [["image.png"]]]],
            },
          ],
        },
        options,
      ),
    /双引号/,
  );
});

test("falls back to the default accent and defaults", () => {
  const model = normalizeNavbox(
    {
      title: "T",
      accent: "not-a-color",
      groups: [{ label: "S", rows: [["A", "B"]] }],
    },
    { defaultAccent: "sky" },
  );

  assert.equal(model.accent, "sky");
  assert.equal(model.collapsed, undefined);
  assert.equal(model.dense, false);
});

test("rejects missing groups", () => {
  assert.throws(
    () => normalizeNavbox({ title: "T" }, options),
    NavboxConfigError,
  );
});

test("rejects rows that are not an array", () => {
  assert.throws(
    () =>
      normalizeNavbox(
        {
          title: "T",
          groups: [{ label: "S", rows: "not-rows" }],
        },
        options,
      ),
    /rows 必须是数组/,
  );
});

test("rejects three-level groups with a clear message", () => {
  assert.throws(
    () =>
      normalizeNavbox(
        {
          title: "T",
          groups: [
            {
              label: "S",
              groups: [
                {
                  label: "G",
                  groups: [{ label: "too deep" }],
                },
              ],
            },
          ],
        },
        options,
      ),
    /只支持两级分组/,
  );
});

test("hashString is stable and distinguishes content", () => {
  assert.equal(hashString("abc"), hashString("abc"));
  assert.notEqual(hashString("abc"), hashString("abd"));
  assert.match(hashString("水果"), /^[a-z0-9]+$/);
});

test("supports Chinese and English action labels", () => {
  const zh = createI18n("zh");
  const en = createI18n("en");

  assert.equal(zh.action("view").label, "查");
  assert.equal(en.action("view").label, "View");
  assert.equal(en.action("edit").label, "Edit");
  assert.equal(en.t("notice.collapsed", { count: 2 }), "Collapsed 2 navbox(es).");
  assert.match(en.settingsExample.join("\n"), /title: Fruit/);
});

test("resolves manual languages and validates language values", () => {
  assert.equal(resolveLocale("zh"), "zh");
  assert.equal(resolveLocale("en"), "en");
  assert.equal(isAppLanguage("auto"), true);
  assert.equal(isAppLanguage("en"), true);
  assert.equal(isAppLanguage("fr"), false);
});

test("uses localized defaults and validation messages", () => {
  const model = normalizeNavbox(
    {
      groups: [{ label: "Info", rows: [["A", "B"]] }],
    },
    { defaultAccent: "mint", language: "en" },
  );
  assert.equal(model.title, "Navbox");

  assert.throws(
    () =>
      normalizeNavbox(
        {
          title: "T",
          groups: [{ label: "S", rows: "not-rows" }],
        },
        { defaultAccent: "mint", language: "en" },
      ),
    /rows in Section 1 must be an array/,
  );
});

function readExample(path) {
  const note = readFileSync(path, "utf8");
  const match = /```wiki-navbox\r?\n([\s\S]*?)\r?\n```/.exec(note);
  assert.ok(match, `${path} must contain a wiki-navbox code block`);
  return loadYaml(match[1]);
}

test("the Chinese fruit example parses into the expected structure", () => {
  const model = normalizeNavbox(readExample("examples/水果.md"), {
    ...options,
    language: "zh",
  });
  assert.equal(model.title, "[[水果]]");
  assert.equal(model.sections.length, 3);
  assert.equal(model.sections[1].label, "品种示例");
  assert.equal(model.sections[1].groups.length, 2);
  assert.equal(model.sections[1].groups[0].rows.length, 3);
  assert.equal(model.sections[1].groups[1].value, "圆形，果皮多为红色、绿色或黄色");
});

test("the English fruit example parses into the expected structure", () => {
  const model = normalizeNavbox(readExample("examples/Fruit.md"), {
    ...options,
    language: "en",
  });
  assert.equal(model.title, "[[Fruit]]");
  assert.equal(model.sections.length, 3);
  assert.equal(model.sections[1].label, "Varieties");
  assert.equal(model.sections[1].groups.length, 2);
  assert.equal(model.sections[1].groups[0].rows.length, 3);
  assert.equal(
    model.sections[1].groups[1].value,
    "Round fruit, usually red, green, or yellow",
  );
});
