import { spawn } from "node:child_process";

const allowedRootFiles = new Set([
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "package.json",
]);
const allowedPrefixes = [".codex-plugin/", "content/", "dist/", "skills/"];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const requiredFiles = [
  ".codex-plugin/plugin.json",
  "CHANGELOG.md",
  "dist/bin.js",
  "dist/index.d.ts",
  "dist/index.js",
];

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      shell: process.platform === "win32" && command.endsWith(".cmd"),
      stdio: ["ignore", "pipe", "inherit"],
    });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(stdout);
      else
        reject(
          new Error(`${command} exited with status ${code ?? "unknown"}.`),
        );
    });
  });
}

const output = await run(npmCommand, ["pack", "--dry-run", "--json"]);
const result = JSON.parse(output);
const files = result[0]?.files;
if (!Array.isArray(files)) {
  throw new Error("npm pack did not return a file inventory.");
}

const paths = files.map(({ path }) => path);
const unexpected = paths.filter(
  (path) =>
    typeof path !== "string" ||
    (!allowedRootFiles.has(path) &&
      !allowedPrefixes.some((prefix) => path.startsWith(prefix))),
);
if (unexpected.length > 0) {
  throw new Error(
    `npm pack contains unexpected files: ${unexpected.join(", ")}`,
  );
}

const missing = requiredFiles.filter((path) => !paths.includes(path));
if (missing.length > 0) {
  throw new Error(
    `npm pack is missing required package files: ${missing.join(", ")}`,
  );
}

console.info(`npm pack allowlist passed with ${files.length} files.`);
