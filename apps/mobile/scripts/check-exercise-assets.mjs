import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const root = process.cwd();
const componentPath = join(root, "src/components/clinical/ExerciseVisual.tsx");
const seedPath = join(
  root,
  "../backend/src/modules/atividades/exercicio-catalog.seed.ts",
);
const assetsDir = join(root, "assets/exercises");

const genericImageTypes = new Set([
  "MOBILIDADE_GERAL",
  "MOBILIDADE_LOMBAR",
  "CONTROLE_CERVICAL",
  "OMBRO_MANGUITO",
  "JOELHO_AGACHAMENTO",
  "QUADRIL_GLUTEOS",
  "TORNOZELO_EQUILIBRIO",
  "PUNHO_PREENSAO",
]);

const component = readFileSync(componentPath, "utf8");
const seed = readFileSync(seedPath, "utf8");

const assetMap = new Map();
const assetRegex = /([A-Z0-9_]+):\s*require\("([^"]+)"\)/g;
let assetMatch = assetRegex.exec(component);
while (assetMatch) {
  assetMap.set(assetMatch[1], assetMatch[2]);
  assetMatch = assetRegex.exec(component);
}

const seedKeys = new Set();
const seedRegex = /imagemKey:\s*ExerciseImageType\.([A-Z0-9_]+)/g;
let seedMatch = seedRegex.exec(seed);
while (seedMatch) {
  seedKeys.add(seedMatch[1]);
  seedMatch = seedRegex.exec(seed);
}

const requiredKeys = [...seedKeys]
  .filter((key) => !genericImageTypes.has(key))
  .sort();
const failures = [];

if (!requiredKeys.length) {
  failures.push("nenhuma imagem especifica encontrada no seed do catalogo");
}

for (const key of requiredKeys) {
  if (!assetMap.has(key)) {
    failures.push(`${key}: sem asset mapeado em ExerciseVisual`);
  }
}

const referencedAssetNames = new Set();
for (const [key, relativePath] of assetMap) {
  const resolvedPath = join(
    root,
    "src/components/clinical",
    relativePath,
  );
  const fileName = basename(resolvedPath);
  referencedAssetNames.add(fileName);

  if (!existsSync(resolvedPath)) {
    failures.push(`${key}: arquivo nao encontrado em ${relativePath}`);
  }
  if (extname(fileName) !== ".jpg") {
    failures.push(`${key}: asset deve ser JPG (${fileName})`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.jpg$/.test(fileName)) {
    failures.push(`${key}: nome deve ser kebab-case (${fileName})`);
  }
}

const localAssetFiles = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
const localJpgAssets = localAssetFiles.filter(
  (name) => extname(name) === ".jpg",
);
const unsupportedImageAssets = localAssetFiles.filter((name) =>
  [".jpeg", ".png", ".webp"].includes(extname(name)),
);

if (!existsSync(assetsDir)) {
  failures.push("pasta assets/exercises nao encontrada");
}

for (const fileName of unsupportedImageAssets) {
  failures.push(`${fileName}: use JPG otimizado em assets/exercises`);
}

for (const fileName of localJpgAssets) {
  if (!referencedAssetNames.has(fileName)) {
    failures.push(`${fileName}: JPG sem referencia em ExerciseVisual`);
  }
}

if (failures.length) {
  console.error("Exercise asset check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Exercise asset check passed for ${requiredKeys.length} specific asset(s).`,
);
