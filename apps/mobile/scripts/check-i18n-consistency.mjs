import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.argv[2] || "src/i18n/locales";
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (!EXTENSIONS.has(extname(fullPath))) continue;
    files.push(fullPath);
  }
  return files;
}

function extractMapKeys(blockText) {
  const keys = new Set();
  const keyRegex = /"([^"]+)"\s*:/g;
  let match = keyRegex.exec(blockText);
  while (match) {
    keys.add(match[1]);
    match = keyRegex.exec(blockText);
  }
  return keys;
}

function diff(reference, candidate) {
  const missing = [];
  for (const key of reference) {
    if (!candidate.has(key)) missing.push(key);
  }
  return missing;
}

function formatList(items, limit = 20) {
  if (items.length <= limit) return items.join(", ");
  return `${items.slice(0, limit).join(", ")} ... (+${items.length - limit})`;
}

function analyzeFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const exportRegex =
    /export const\s+(pt\w*|en\w*|es\w*)\s*:\s*TranslationMap\s*=\s*\{([\s\S]*?)\n\};/g;

  const tables = new Map();
  let match = exportRegex.exec(content);
  while (match) {
    const exportName = match[1];
    const lang = exportName.slice(0, 2); // pt | en | es
    const keys = extractMapKeys(match[2]);
    tables.set(lang, keys);
    match = exportRegex.exec(content);
  }

  if (!tables.has("pt") || !tables.has("en") || !tables.has("es")) {
    return [];
  }

  const ptKeys = tables.get("pt");
  const enKeys = tables.get("en");
  const esKeys = tables.get("es");

  const issues = [];
  const enMissing = diff(ptKeys, enKeys);
  const esMissing = diff(ptKeys, esKeys);
  const onlyEn = diff(enKeys, ptKeys);
  const onlyEs = diff(esKeys, ptKeys);

  if (enMissing.length) {
    issues.push(
      `${filePath}: missing in EN -> ${formatList(enMissing.sort())}`,
    );
  }
  if (esMissing.length) {
    issues.push(
      `${filePath}: missing in ES -> ${formatList(esMissing.sort())}`,
    );
  }
  if (onlyEn.length) {
    issues.push(
      `${filePath}: only in EN (not in PT baseline) -> ${formatList(
        onlyEn.sort(),
      )}`,
    );
  }
  if (onlyEs.length) {
    issues.push(
      `${filePath}: only in ES (not in PT baseline) -> ${formatList(
        onlyEs.sort(),
      )}`,
    );
  }

  return issues;
}

const files = walk(ROOT);
const issues = [];
for (const file of files) {
  issues.push(...analyzeFile(file));
}

if (issues.length) {
  console.error("i18n consistency check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`i18n consistency check passed for ${files.length} file(s) in ${ROOT}.`);
