import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`\n[wiki-navbox] ${message}\n`);
  process.exit(1);
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
  fail("找不到 esbuild 平台二进制，请先执行 npm install。");
  return "";
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) {
    fail(`${label} 启动失败：${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} 失败（exit ${result.status ?? "unknown"}）。`);
  }
}

mkdirSync(join(root, ".test"), { recursive: true });
run(
  esbuildBinary(),
  [
    "src/model.ts",
    "--bundle",
    "--format=esm",
    "--platform=node",
    "--outfile=.test/model.mjs",
    "--log-level=warning",
  ],
  "测试模块构建",
);
run(
  esbuildBinary(),
  [
    "src/i18n.ts",
    "--bundle",
    "--format=esm",
    "--platform=node",
    "--outfile=.test/i18n.mjs",
    "--log-level=warning",
  ],
  "多语言模块构建",
);
run(
  process.execPath,
  ["tests/model.test.mjs"],
  "单元测试",
);
