import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  updateCrmAdminPatient,
  updateCrmAdminProfessional,
} from "../../services/crm";
import { parseApiError } from "../../utils/apiErrors";
import {
  createEmptyPatientEditForm,
  createEmptyProfessionalEditForm,
} from "./AdminCrmScreen.constants";

type AdminEntityToast = {
  type: "error" | "success";
  message: string;
};

type AdminEntityActionsParams = {
  selectedProfId: string;
  selectedPacId: string;
  profEditForm: ReturnType<typeof createEmptyProfessionalEditForm>;
  pacEditForm: ReturnType<typeof createEmptyPatientEditForm>;
  includeSensitiveData: boolean;
  sensitiveReason: string;
  setEditProfOpen: Dispatch<SetStateAction<boolean>>;
  setEditPacOpen: Dispatch<SetStateAction<boolean>>;
  loadMain: () => Promise<void>;
  showToast: (toast: AdminEntityToast) => void;
  t: (key: string) => string;
};

export function useAdminCrmEntityActions({
  selectedProfId,
  selectedPacId,
  profEditForm,
  pacEditForm,
  includeSensitiveData,
  sensitiveReason,
  setEditProfOpen,
  setEditPacOpen,
  loadMain,
  showToast,
  t,
}: AdminEntityActionsParams) {
  const [savingAdminEntity, setSavingAdminEntity] = useState(false);
  const sensitiveOptions = useMemo(
    () => ({
      includeSensitive: includeSensitiveData,
      sensitiveReason: includeSensitiveData ? sensitiveReason : undefined,
    }),
    [includeSensitiveData, sensitiveReason],
  );

  const saveAdminProfessional = useCallback(async () => {
    if (!selectedProfId) return;
    if (!profEditForm.nome.trim()) {
      showToast({
        type: "error",
        message: t("crm.messages.enterProfessionalName"),
      });
      return;
    }
    if (!profEditForm.email.trim()) {
      showToast({
        type: "error",
        message: t("crm.messages.enterProfessionalEmail"),
      });
      return;
    }
    setSavingAdminEntity(true);
    try {
      await updateCrmAdminProfessional(
        selectedProfId,
        {
          nome: profEditForm.nome.trim(),
          email: profEditForm.email.trim().toLowerCase(),
          especialidade: profEditForm.especialidade.trim(),
          registroProf: profEditForm.registroProf.trim(),
          ativo: profEditForm.ativo,
        },
        sensitiveOptions,
      );
      setEditProfOpen(false);
      await loadMain();
      showToast({
        type: "success",
        message: t("crm.messages.professionalUpdatedSuccess"),
      });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({
        type: "error",
        message: parsed.message || t("crm.messages.professionalUpdateFailed"),
      });
    } finally {
      setSavingAdminEntity(false);
    }
  }, [
    loadMain,
    profEditForm,
    selectedProfId,
    sensitiveOptions,
    setEditProfOpen,
    showToast,
    t,
  ]);

  const saveAdminPatient = useCallback(async () => {
    if (!selectedPacId) return;
    if (!pacEditForm.nomeCompleto.trim()) {
      showToast({ type: "error", message: t("crm.messages.enterPatientName") });
      return;
    }
    setSavingAdminEntity(true);
    try {
      await updateCrmAdminPatient(
        selectedPacId,
        {
          nomeCompleto: pacEditForm.nomeCompleto.trim(),
          cpf: pacEditForm.cpf.replace(/\D/g, "") || undefined,
          dataNascimento: pacEditForm.dataNascimento || undefined,
          sexo: pacEditForm.sexo as "MASCULINO" | "FEMININO" | "OUTRO",
          estadoCivil: pacEditForm.estadoCivil as
            | "SOLTEIRO"
            | "CASADO"
            | "VIUVO"
            | "DIVORCIADO"
            | "UNIAO_ESTAVEL",
          profissao: pacEditForm.profissao.trim(),
          contatoWhatsapp:
            pacEditForm.contatoWhatsapp.replace(/\D/g, "") || undefined,
          contatoTelefone:
            pacEditForm.contatoTelefone.replace(/\D/g, "") || undefined,
          contatoEmail: pacEditForm.contatoEmail.trim() || undefined,
          enderecoCidade: pacEditForm.enderecoCidade.trim() || undefined,
          enderecoUf: pacEditForm.enderecoUf.trim().toUpperCase() || undefined,
          ativo: pacEditForm.ativo,
        },
        sensitiveOptions,
      );
      setEditPacOpen(false);
      await loadMain();
      showToast({
        type: "success",
        message: t("crm.messages.patientUpdatedSuccess"),
      });
    } catch (error) {
      const parsed = parseApiError(error);
      showToast({
        type: "error",
        message: parsed.message || t("crm.messages.patientUpdateFailed"),
      });
    } finally {
      setSavingAdminEntity(false);
    }
  }, [
    loadMain,
    pacEditForm,
    selectedPacId,
    sensitiveOptions,
    setEditPacOpen,
    showToast,
    t,
  ]);

  return {
    savingAdminEntity,
    saveAdminProfessional,
    saveAdminPatient,
  };
}
