import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  watch as watchFs,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const skipTypecheck = args.has("--skip-typecheck");
const skipPreview = args.has("--no-preview");

function fail(message, code = 1) {
  console.error(`\n[wiki-navbox] ${message}\n`);
  process.exit(code);
}

function run(command, commandArgs, label, allowFailure = false) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) {
    if (allowFailure) {
      console.error(`[wiki-navbox] ${label} 启动失败：${result.error.message}`);
      return false;
    }
    fail(`${label} 启动失败：${result.error.message}`);
  }
  if (result.status !== 0) {
    if (allowFailure) {
      console.error(
        `[wiki-navbox] ${label} 失败（exit ${result.status ?? "unknown"}）。`,
      );
      return false;
    }
    fail(`${label} 失败（exit ${result.status ?? "unknown"}）。`);
  }
  return true;
}

function esbuildBinary() {
  const packageName = `@esbuild/${process.platform}-${process.arch}`;
  const names =
    process.platform === "win32"
      ? ["esbuild.exe"]
      : ["esbuild", "bin/esbuild"];
  for (const name of names) {
    const candidate = join(root, "node_modules", packageName, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  fail(
    "找不到 esbuild 平台二进制。请先执行 npm install；若被安全策略阻止，请删除 node_modules 后重新安装。",
  );
  return "";
}

function tscPath() {
  const candidate = join(root, "node_modules", "typescript", "bin", "tsc");
  if (!existsSync(candidate)) {
    fail("找不到 TypeScript。请先执行 npm install。");
  }
  return candidate;
}

function ensureDirectory(path) {
  mkdirSync(path, { recursive: true });
}

function copyFile(from, to) {
  ensureDirectory(dirname(to));
  cpSync(join(root, from), join(root, to));
}

function copyAssets() {
  for (const target of [
    "dist/wiki-navbox",
    "demo-vault/.obsidian/plugins/wiki-navbox",
  ]) {
    copyFile("main.js", `${target}/main.js`);
    copyFile("manifest.json", `${target}/manifest.json`);
    copyFile("styles.css", `${target}/styles.css`);
  }

  const exampleDir = join(root, "examples");
  if (existsSync(exampleDir)) {
    ensureDirectory(join(root, "demo-vault"));
    for (const entry of readdirSync(exampleDir)) {
      if (entry.endsWith(".md")) {
        copyFile(`examples/${entry}`, `demo-vault/${entry}`);
      }
    }
  }

  ensureDirectory(join(root, "demo-vault/.obsidian"));
  const communityPath = join(
    root,
    "demo-vault/.obsidian/community-plugins.json",
  );
  let plugins = [];
  if (existsSync(communityPath)) {
    try {
      const parsed = JSON.parse(readFileSync(communityPath, "utf8"));
      if (Array.isArray(parsed)) {
        plugins = parsed.filter((value) => typeof value === "string");
      }
    } catch {
      plugins = [];
    }
  }
  if (!plugins.includes("wiki-navbox")) {
    plugins.push("wiki-navbox");
  }
  writeFileSync(
    communityPath,
    `${JSON.stringify(plugins, null, 2)}\n`,
    "utf8",
  );
}

const esbuild = esbuildBinary();
const pluginArgs = [
  "src/main.ts",
  "--bundle",
  "--external:obsidian",
  "--format=cjs",
  "--platform=browser",
  "--target=es2018",
  "--outfile=main.js",
  "--log-level=info",
];
const previewArgs = [
  "preview/demo.ts",
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=es2018",
  "--outfile=preview/demo.js",
  "--log-level=warning",
];

function buildOnce(allowFailure = false) {
  if (!run(esbuild, pluginArgs, "插件构建", allowFailure)) {
    return false;
  }
  copyAssets();
  if (!skipPreview) {
    if (!run(esbuild, previewArgs, "预览构建", allowFailure)) {
      return false;
    }
  }
  return true;
}

if (!skipTypecheck) {
  run(
    process.execPath,
    [tscPath(), "--noEmit"],
    "TypeScript 类型检查",
  );
}

if (!buildOnce()) {
  process.exit(1);
}

console.log(
  "\n[wiki-navbox] 构建完成：main.js / dist/wiki-navbox / demo-vault",
);

if (watch) {
  let timer = null;
  let building = false;
  console.log("[wiki-navbox] 正在监听 src/ 和 styles.css ...");
  watchFs(join(root, "src"), { recursive: true }, () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (building) {
        return;
      }
      building = true;
      console.log("\n[wiki-navbox] 文件变化，重新构建 ...");
      buildOnce(true);
      building = false;
    }, 80);
  });
  watchFs(join(root, "styles.css"), () => {
    copyAssets();
  });
  await new Promise(() => {});
}
