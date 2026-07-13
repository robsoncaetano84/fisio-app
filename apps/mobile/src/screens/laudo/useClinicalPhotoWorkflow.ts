import { useCallback, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  analyzeClinicalPhoto,
  listClinicalPhotos,
  logClinicalAiSuggestion,
  uploadClinicalPhoto,
  type ClinicalPhotoType,
  type ClinicalPhotoView,
} from "../../services";

type ToastInput = {
  type: "success" | "error";
  message: string;
};

type UseClinicalPhotoWorkflowParams = {
  pacienteId: string;
  showToast: (input: ToastInput) => void;
};

export function useClinicalPhotoWorkflow({
  pacienteId,
  showToast,
}: UseClinicalPhotoWorkflowParams) {
  const [posturePhotosCount, setPosturePhotosCount] = useState(0);
  const [movementPhotosCount, setMovementPhotosCount] = useState(0);
  const [loadingPosturePhotos, setLoadingPosturePhotos] = useState(false);
  const [loadingMovementPhotos, setLoadingMovementPhotos] = useState(false);
  const [uploadingPosturePhoto, setUploadingPosturePhoto] = useState(false);
  const [uploadingMovementPhoto, setUploadingMovementPhoto] = useState(false);

  const loadClinicalPhotosCount = useCallback(async () => {
    setLoadingPosturePhotos(true);
    setLoadingMovementPhotos(true);
    try {
      const photos = await listClinicalPhotos(pacienteId);
      const postureTotal = photos.filter((item) =>
        String(item.tipo || "").startsWith("FOTO_POSTURAL"),
      ).length;
      const movementTotal = photos.filter(
        (item) => String(item.tipo || "") === "FOTO_MOVIMENTO_ADM",
      ).length;
      setPosturePhotosCount(postureTotal);
      setMovementPhotosCount(movementTotal);
    } catch {
      setPosturePhotosCount(0);
      setMovementPhotosCount(0);
    } finally {
      setLoadingPosturePhotos(false);
      setLoadingMovementPhotos(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    loadClinicalPhotosCount().catch(() => undefined);
  }, [loadClinicalPhotosCount]);

  const handleUploadClinicalPhoto = useCallback(
    async (
      tipo: ClinicalPhotoType,
      vista: ClinicalPhotoView,
      source: "camera" | "gallery",
    ) => {
      try {
        if (source === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            showToast({
              type: "error",
              message: "Permita acesso a camera para registrar a foto.",
            });
            return;
          }
        } else {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            showToast({
              type: "error",
              message: "Permita acesso a galeria para selecionar a foto.",
            });
            return;
          }
        }

        const result =
          source === "camera"
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ["images"],
                quality: 0.85,
                allowsEditing: false,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.9,
                allowsEditing: false,
              });
        if (result.canceled || !result.assets?.length) return;

        const file = result.assets[0];
        if (!file?.uri) {
          showToast({ type: "error", message: "Arquivo invalido." });
          return;
        }

        const inferredMime = file.mimeType || "image/jpeg";
        if (!inferredMime.startsWith("image/")) {
          showToast({
            type: "error",
            message: "Envie apenas imagem (png, jpg, webp).",
          });
          return;
        }

        const isPosturePhoto = String(tipo).startsWith("FOTO_POSTURAL");
        if (isPosturePhoto) {
          setUploadingPosturePhoto(true);
        } else {
          setUploadingMovementPhoto(true);
        }

        const uploaded = await uploadClinicalPhoto(pacienteId, file, {
          tipo,
          vista,
          observacao: isPosturePhoto
            ? "Foto de observacao postural padronizada"
            : "Foto de movimento/ADM padronizada",
        });
        const analyzed = await analyzeClinicalPhoto(pacienteId, uploaded.id);
        if (analyzed.aiAnalise) {
          await logClinicalAiSuggestion({
            stage: "EXAME_FISICO",
            suggestionType: "VISUAL_ANALYSIS",
            confidence:
              analyzed.qualityScore && analyzed.qualityScore >= 70
                ? "MODERADA"
                : "BAIXA",
            reason: analyzed.aiAnalise.slice(0, 400),
            evidenceFields: ["clinicalPhoto", "aiAnalise", "qualityScore"],
            patientId: pacienteId,
          }).catch(() => undefined);
        }
        showToast({
          type: "success",
          message: "Foto registrada e analisada.",
        });
        await loadClinicalPhotosCount();
      } catch (error) {
        const detail =
          (error as { response?: { data?: { message?: string | string[] } } })
            ?.response?.data?.message ||
          (error as Error)?.message ||
          "";
        const detailText = Array.isArray(detail)
          ? detail.join("; ")
          : String(detail || "").trim();
        showToast({
          type: "error",
          message: detailText
            ? `Nao foi possivel enviar a foto: ${detailText}`
            : "Nao foi possivel enviar a foto.",
        });
      } finally {
        setUploadingPosturePhoto(false);
        setUploadingMovementPhoto(false);
      }
    },
    [loadClinicalPhotosCount, pacienteId, showToast],
  );

  return {
    posturePhotosCount,
    movementPhotosCount,
    loadingPosturePhotos,
    loadingMovementPhotos,
    uploadingPosturePhoto,
    uploadingMovementPhoto,
    handleUploadClinicalPhoto,
  };
}
