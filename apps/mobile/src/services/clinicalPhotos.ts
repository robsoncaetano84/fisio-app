import { Platform } from "react-native";
import { api } from "./api";

export type ClinicalPhotoType =
  | "FOTO_POSTURAL_FRONTAL"
  | "FOTO_POSTURAL_POSTERIOR"
  | "FOTO_POSTURAL_LATERAL_DIREITA"
  | "FOTO_POSTURAL_LATERAL_ESQUERDA"
  | "FOTO_MOVIMENTO_ADM"
  | "FOTO_EVOLUCAO_BASELINE"
  | "FOTO_EVOLUCAO_FOLLOWUP";

export type ClinicalPhotoView =
  | "ANTERIOR"
  | "POSTERIOR"
  | "LATERAL_DIREITA"
  | "LATERAL_ESQUERDA"
  | "MOVIMENTO";

export type ClinicalPhotoItem = {
  id: string;
  pacienteId: string;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  tipo: ClinicalPhotoType;
  vista?: ClinicalPhotoView | null;
  regiao?: string | null;
  lado?: string | null;
  intensidadeDor?: number | null;
  observacao?: string | null;
  dataFoto?: string | null;
  qualityScore?: number | null;
  aiAnalise?: string | null;
  aiLimites?: string | null;
  aiRaw?: Record<string, unknown> | null;
  confirmadoPorProfissional?: boolean;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
};

export type ClinicalPhotoComparisonItem = {
  id: string;
  pacienteId: string;
  baselinePhotoId: string;
  followupPhotoId: string;
  regiao?: string | null;
  vista?: string | null;
  observacao?: string | null;
  resumo?: string | null;
  aiComparacao?: string | null;
  aiLimites?: string | null;
  aiRaw?: Record<string, unknown> | null;
  confirmadoPorProfissional?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClinicalPhotoUploadAsset = {
  uri: string;
  fileName?: string | null;
  name?: string | null;
  mimeType?: string | null;
  type?: string | null;
  file?: File;
};

export type ClinicalPhotoUploadMetadata = {
  tipo: ClinicalPhotoType;
  vista?: ClinicalPhotoView;
  regiao?: string;
  lado?: string;
  intensidadeDor?: number;
  observacao?: string;
  dataFoto?: string;
};

const inferMimeType = (asset: ClinicalPhotoUploadAsset) => {
  const explicit = asset.mimeType || asset.type;
  if (explicit?.startsWith("image/")) return explicit;
  const name = String(asset.fileName || asset.name || asset.uri || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
};

const inferFileName = (asset: ClinicalPhotoUploadAsset, fallback: string) => {
  const explicit = asset.fileName || asset.name;
  if (explicit) return explicit;
  const uriPart = asset.uri.split("/").pop();
  if (uriPart && uriPart.includes(".")) return uriPart;
  return fallback;
};

export const listClinicalPhotos = async (
  pacienteId: string,
): Promise<ClinicalPhotoItem[]> => {
  const response = await api.get<ClinicalPhotoItem[]>(
    `/pacientes/${pacienteId}/fotos-clinicas`,
  );
  return response.data;
};

export const listClinicalPhotoComparisons = async (
  pacienteId: string,
): Promise<ClinicalPhotoComparisonItem[]> => {
  const response = await api.get<ClinicalPhotoComparisonItem[]>(
    `/pacientes/${pacienteId}/fotos-clinicas/comparacoes`,
  );
  return response.data;
};

export const uploadClinicalPhoto = async (
  pacienteId: string,
  asset: ClinicalPhotoUploadAsset,
  metadata: ClinicalPhotoUploadMetadata,
): Promise<ClinicalPhotoItem> => {
  const formData = new FormData();
  const mimeType = inferMimeType(asset);
  const fileName = inferFileName(asset, `foto-clinica-${Date.now()}.jpg`);

  if (Platform.OS === "web") {
    if (asset.file) {
      formData.append("file", asset.file, fileName);
    } else {
      const blob = await fetch(asset.uri).then((res) => res.blob());
      formData.append("file", blob, fileName);
    }
  } else {
    formData.append("file", {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  formData.append("tipo", metadata.tipo);
  if (metadata.vista) formData.append("vista", metadata.vista);
  if (metadata.regiao) formData.append("regiao", metadata.regiao);
  if (metadata.lado) formData.append("lado", metadata.lado);
  if (typeof metadata.intensidadeDor === "number") {
    formData.append("intensidadeDor", String(metadata.intensidadeDor));
  }
  if (metadata.observacao) formData.append("observacao", metadata.observacao);
  if (metadata.dataFoto) formData.append("dataFoto", metadata.dataFoto);

  const response = await api.post<ClinicalPhotoItem>(
    `/pacientes/${pacienteId}/fotos-clinicas`,
    formData,
    {
      timeout: 120000,
      headers:
        Platform.OS === "web"
          ? undefined
          : {
              "Content-Type": "multipart/form-data",
            },
    },
  );
  return response.data;
};

export const analyzeClinicalPhoto = async (
  pacienteId: string,
  photoId: string,
): Promise<ClinicalPhotoItem> => {
  const response = await api.post<ClinicalPhotoItem>(
    `/pacientes/${pacienteId}/fotos-clinicas/${photoId}/analisar`,
    {},
    { timeout: 120000 },
  );
  return response.data;
};

export const compareClinicalPhotos = async (
  pacienteId: string,
  payload: {
    baselinePhotoId: string;
    followupPhotoId: string;
    regiao?: string;
    vista?: string;
    observacao?: string;
  },
): Promise<ClinicalPhotoComparisonItem> => {
  const response = await api.post<ClinicalPhotoComparisonItem>(
    `/pacientes/${pacienteId}/fotos-clinicas/comparar`,
    payload,
    { timeout: 120000 },
  );
  return response.data;
};
