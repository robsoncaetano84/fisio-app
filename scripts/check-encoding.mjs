import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = process.argv[2] || "src";
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md"]);
const SUSPECT_REGEX =
  /(?:\u00c3[\u0080-\u00ff]|\u00c2[\u0080-\u00ff]|\u00e2[\u0080-\u00ff]|\uFFFD)/g;
const DOUBLE_ESCAPED_UNICODE_REGEX = /\\\\u00[0-9a-fA-F]{2}/g;

function walk(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (!EXTENSIONS.has(extname(fullPath))) {
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function findSuspects(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings = [];
  for (let i = 0; i < lines.length; i += 1) {
    SUSPECT_REGEX.lastIndex = 0;
    DOUBLE_ESCAPED_UNICODE_REGEX.lastIndex = 0;
    if (
      SUSPECT_REGEX.test(lines[i]) ||
      DOUBLE_ESCAPED_UNICODE_REGEX.test(lines[i])
    ) {
      findings.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return findings;
}

const files = walk(ROOT);
const issues = [];
for (const file of files) {
  const suspects = findSuspects(file);
  for (const suspect of suspects) {
    issues.push(`${file}:${suspect.line} ${suspect.text}`);
  }
}

if (issues.length) {
  console.error("Encoding check failed. Suspicious text detected:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Encoding check passed for ${files.length} file(s) in ${ROOT}.`);
