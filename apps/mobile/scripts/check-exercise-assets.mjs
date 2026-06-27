import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const root = process.cwd();
const componentPath = join(root, "src/components/clinical/ExerciseVisual.tsx");
const seedPath = join(
  root,
  "../backend/src/modules/atividades/exercicio-catalog.seed.ts",
);
const previewSeedPath = join(
  root,
  "../backend/src/modules/atividades/exercise-catalog-preview.seed.ts",
);
const masterSeedPath = join(
  root,
  "../backend/src/modules/atividades/exercise-catalog-master.seed.ts",
);
const backendEnumPath = join(
  root,
  "../backend/src/modules/atividades/exercise-image-type.enum.ts",
);
const assetsDir = join(root, "assets/exercises");
const maxAssetBytes = 250 * 1024;
const maxTotalAssetBytes = 8 * 1024 * 1024;
const minAssetEdge = 1000;
const maxAssetEdge = 1600;

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
const seed = [seedPath, previewSeedPath, masterSeedPath]
  .filter((filePath) => existsSync(filePath))
  .map((filePath) => readFileSync(filePath, "utf8"))
  .join("\n");
const backendEnum = readFileSync(backendEnumPath, "utf8");
const failures = [];

const readJpegDimensions = (filePath) => {
  const buffer = readFileSync(filePath);
  let offset = 2;

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xcc
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
};

const sorted = (items) => [...items].sort();
const sameSet = (left, right) =>
  left.size === right.size && [...left].every((item) => right.has(item));
const reportSetMismatch = (label, expected, received) => {
  const missing = sorted(expected).filter((item) => !received.has(item));
  const extra = sorted(received).filter((item) => !expected.has(item));
  if (missing.length) {
    failures.push(`${label}: faltando ${missing.join(", ")}`);
  }
  if (extra.length) {
    failures.push(`${label}: sobrando ${extra.join(", ")}`);
  }
};

const backendTypes = new Set();
const backendTypeRegex = /^\s*([A-Z0-9_]+)\s*=/gm;
let backendTypeMatch = backendTypeRegex.exec(backendEnum);
while (backendTypeMatch) {
  backendTypes.add(backendTypeMatch[1]);
  backendTypeMatch = backendTypeRegex.exec(backendEnum);
}

const mobileTypes = new Set();
const mobileTypeRegex = /\|\s*"([A-Z0-9_]+)"/g;
let mobileTypeMatch = mobileTypeRegex.exec(component);
while (mobileTypeMatch) {
  mobileTypes.add(mobileTypeMatch[1]);
  mobileTypeMatch = mobileTypeRegex.exec(component);
}

const mobileOptionTypes = new Set();
const mobileOptionRegex = /value:\s*"([A-Z0-9_]+)"/g;
let mobileOptionMatch = mobileOptionRegex.exec(component);
while (mobileOptionMatch) {
  mobileOptionTypes.add(mobileOptionMatch[1]);
  mobileOptionMatch = mobileOptionRegex.exec(component);
}

if (!sameSet(backendTypes, mobileTypes)) {
  reportSetMismatch(
    "mobile ExerciseImageType desalinhado com backend",
    backendTypes,
    mobileTypes,
  );
}

if (!sameSet(backendTypes, mobileOptionTypes)) {
  reportSetMismatch(
    "EXERCISE_IMAGE_OPTIONS desalinhado com backend",
    backendTypes,
    mobileOptionTypes,
  );
}

const assetMap = new Map();
const assetRegex = /([A-Z0-9_]+):\s*require\("([^"]+)"\)/g;
let assetMatch = assetRegex.exec(component);
while (assetMatch) {
  assetMap.set(assetMatch[1], assetMatch[2]);
  assetMatch = assetRegex.exec(component);
}

const seedKeys = new Set();
const seedRegex = /ExerciseImageType\.([A-Z0-9_]+)/g;
let seedMatch = seedRegex.exec(seed);
while (seedMatch) {
  seedKeys.add(seedMatch[1]);
  seedMatch = seedRegex.exec(seed);
}

const requiredKeys = [...seedKeys]
  .filter((key) => !genericImageTypes.has(key))
  .sort();

if (!requiredKeys.length) {
  failures.push("nenhuma imagem especifica encontrada no seed do catalogo");
}

for (const key of seedKeys) {
  if (!backendTypes.has(key)) {
    failures.push(`${key}: imagemKey do seed nao existe no enum do backend`);
  }
}

for (const key of assetMap.keys()) {
  if (!backendTypes.has(key)) {
    failures.push(`${key}: asset mapeado nao existe no enum do backend`);
  }
}

for (const key of requiredKeys) {
  if (!assetMap.has(key)) {
    failures.push(`${key}: sem asset mapeado em ExerciseVisual`);
  }
}

const referencedAssetNames = new Set();
for (const [key, relativePath] of assetMap) {
  const resolvedPath = join(root, "src/components/clinical", relativePath);
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

let totalAssetBytes = 0;
for (const fileName of localJpgAssets) {
  const assetPath = join(assetsDir, fileName);
  const size = statSync(assetPath).size;
  const dimensions = readJpegDimensions(assetPath);
  totalAssetBytes += size;

  if (size > maxAssetBytes) {
    failures.push(
      `${fileName}: ${size} bytes excede limite de ${maxAssetBytes} bytes`,
    );
  }

  if (!dimensions) {
    failures.push(`${fileName}: nao foi possivel ler dimensoes do JPG`);
    continue;
  }

  if (dimensions.width !== dimensions.height) {
    failures.push(
      `${fileName}: imagem deve ser quadrada (${dimensions.width}x${dimensions.height})`,
    );
  }

  if (dimensions.width < minAssetEdge || dimensions.width > maxAssetEdge) {
    failures.push(
      `${fileName}: largura ${dimensions.width}px fora do intervalo ${minAssetEdge}-${maxAssetEdge}px`,
    );
  }

  if (dimensions.height < minAssetEdge || dimensions.height > maxAssetEdge) {
    failures.push(
      `${fileName}: altura ${dimensions.height}px fora do intervalo ${minAssetEdge}-${maxAssetEdge}px`,
    );
  }
}

if (totalAssetBytes > maxTotalAssetBytes) {
  failures.push(
    `assets/exercises: ${totalAssetBytes} bytes excede limite total de ${maxTotalAssetBytes} bytes`,
  );
}

if (failures.length) {
  console.error("Exercise asset check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Exercise asset check passed for ${requiredKeys.length} specific asset(s), ${totalAssetBytes} bytes total.`,
);
