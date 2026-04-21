// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PACIENTE FORM SCREEN
// ==========================================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, useToast } from "../../components/ui";
import {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../constants/theme";
import {
  PacienteInviteCreateResponse,
  PacienteProfileResponse,
  RootStackParamList,
  Sexo,
  EstadoCivil,
  PacienteCadastroOrigem,
  UserRole,
} from "../../types";
import { usePacienteStore } from "../../stores/pacienteStore";
import { useAuthStore } from "../../stores/authStore";
import { parseApiError } from "../../utils/apiErrors";
import { api } from "../../services";
import { trackEvent } from "../../services/analytics";
import { useLanguage } from "../../i18n/LanguageProvider";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PacienteFormScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PacienteForm">;
  route: {
    params?: {
      pacienteId?: string;
    };
  };
};

// Componente de selecao
interface SelectOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function SelectOption({ label, selected, onPress }: SelectOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.selectOption, selected && styles.selectOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.selectOptionText,
          selected && styles.selectOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Componente de secao do formulario
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function PacienteFormScreen({
  navigation,
  route,
}: PacienteFormScreenProps) {
  const { t } = useLanguage();
  const usuario = useAuthStore((state) => state.usuario);
  const isSelfEditMode = usuario?.role === UserRole.PACIENTE;
  const isEditing = isSelfEditMode ? true : !!route.params?.pacienteId;
  const routePacienteId = route.params?.pacienteId?.trim() || "";
  const { getPacienteById, createPaciente, updatePaciente, deletePaciente } =
    usePacienteStore();
  const { showToast } = useToast();

  // Estados do formulario
  const [loading, setLoading] = useState(false);

  // Dados pessoais
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivil | null>(null);
  const [profissao, setProfissao] = useState("");

  // Contato
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [pacienteUsuarioId, setPacienteUsuarioId] = useState<string | null>(
    null,
  );
  const [anamneseLiberadaPaciente, setAnamneseLiberadaPaciente] =
    useState(false);
  const [currentPacienteId, setCurrentPacienteId] = useState(routePacienteId);
  const [cadastroOrigem, setCadastroOrigem] = useState<PacienteCadastroOrigem>(
    PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
  );
  const isQuickInviteMode =
    !isSelfEditMode && cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO;

  // Endereco
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  // Erros
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isUuid = (value: string | null | undefined) =>
    !!value && UUID_REGEX.test(value.trim());

  const sanitizeProfissao = (value: string | null | undefined) => {
    const normalized = (value || "").replace(/\u00A0/g, " ").trim();
    if (!normalized) return "";
    const withoutBulletPrefix = normalized.replace(/^[a-z]\)\s*/i, "").trim();
    if (!withoutBulletPrefix) return "";
    if (/^[a-z]\)$/i.test(withoutBulletPrefix)) return "";
    return withoutBulletPrefix;
  };

  // Formatadores
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const formatDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  };

  const toApiDate = (value: string) => {
    const parts = value.split("/");
    if (parts.length !== 3) return value;
    const [dd, mm, yyyy] = parts;
    if (!dd || !mm || !yyyy || yyyy.length !== 4) return value;
    return `${yyyy}-${mm}-${dd}`;
  };

  const toInputDate = (value: string) => {
    if (!value) return "";
    if (value.includes("/")) return value;
    const [yyyy, mm, dd] = value.split("T")[0].split("-");
    if (!yyyy || !mm || !dd) return value;
    return `${dd}/${mm}/${yyyy}`;
  };

  const isValidBrDate = (value: string) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return false;
    const [, dd, mm, yyyy] = match;
    const d = Number(dd);
    const m = Number(mm);
    const y = Number(yyyy);
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  };

  // Validacao
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isQuickInviteMode) {
      if (!nomeCompleto.trim()) {
        newErrors.nomeCompleto = t("patientForm.nameRequired");
      }
      if (!whatsapp.trim() && !email.trim()) {
        newErrors.whatsapp = "Informe WhatsApp ou e-mail";
        newErrors.email = "Informe WhatsApp ou e-mail";
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = "E-mail inválido";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!nomeCompleto.trim()) {
      newErrors.nomeCompleto = t("patientForm.nameRequired");
    }

    if (!cpf.trim()) {
      newErrors.cpf = t("patientForm.cpfRequired");
    } else if (cpf.replace(/\D/g, "").length !== 11) {
      newErrors.cpf = t("patientForm.cpfInvalid");
    }

    if (!dataNascimento.trim()) {
      newErrors.dataNascimento = t("patientForm.birthRequired");
    } else if (!isValidBrDate(dataNascimento)) {
      newErrors.dataNascimento = "Data invalida. Use DD/MM/AAAA";
    }

    if (!sexo) {
      newErrors.sexo = t("patientForm.sexRequired");
    }

    if (!whatsapp.trim()) {
      newErrors.whatsapp = t("patientForm.whatsappRequired");
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Buscar CEP
  const buscarCEP = async () => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      showToast({ message: t("patientForm.invalidCep"), type: "error" });
      return;
    }

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        showToast({ message: t("patientForm.cepNotFound"), type: "error" });
        return;
      }

      setRua(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setUf(data.uf || "");
    } catch (error: any) {
      showToast({ message: t("patientForm.cepFetchError"), type: "error" });
    }
  };

  useEffect(() => {
    if (!isEditing) return;

    if (isSelfEditMode) {
      const loadMyProfile = async () => {
        try {
          setLoading(true);
          const response = await api.get<PacienteProfileResponse>("/pacientes/me");
          const paciente = response.data?.paciente;
          if (!paciente) {
            setNomeCompleto(usuario?.nome || "");
            setEmail(usuario?.email || "");
            return;
          }

          setCurrentPacienteId(paciente.id);
          setNomeCompleto(paciente.nomeCompleto || "");
          setCpf(formatCPF(paciente.cpf || ""));
          setDataNascimento(toInputDate(paciente.dataNascimento || ""));
          setSexo(paciente.sexo || null);
          setEstadoCivil(paciente.estadoCivil || null);
          setProfissao(sanitizeProfissao(paciente.profissao));
          setWhatsapp(paciente.contato?.whatsapp || "");
          setEmail(paciente.contato?.email || usuario?.email || "");
          setPacienteUsuarioId(paciente.pacienteUsuarioId || null);
          setAnamneseLiberadaPaciente(!!paciente.anamneseLiberadaPaciente);
          setCadastroOrigem(
            paciente.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
          );
          setCep(formatCEP(paciente.endereco?.cep || ""));
          setRua(paciente.endereco?.rua || "");
          setNumero(paciente.endereco?.numero || "");
          setComplemento(paciente.endereco?.complemento || "");
          setBairro(paciente.endereco?.bairro || "");
          setCidade(paciente.endereco?.cidade || "");
          setUf(paciente.endereco?.uf || "");
        } catch (error) {
          const { message } = parseApiError(error);
          showToast({ message, type: "error" });
        } finally {
          setLoading(false);
        }
      };
      void loadMyProfile();
      return;
    }

    const paciente = getPacienteById(routePacienteId);
    if (!paciente) return;

    setCurrentPacienteId(paciente.id);

    setNomeCompleto(paciente.nomeCompleto);
    setCpf(formatCPF(paciente.cpf));
    setDataNascimento(toInputDate(paciente.dataNascimento));
    setSexo(paciente.sexo);
    setEstadoCivil(paciente.estadoCivil || null);
    setProfissao(sanitizeProfissao(paciente.profissao));
    setWhatsapp(paciente.contato.whatsapp || "");
    setEmail(paciente.contato.email || "");
    setPacienteUsuarioId(paciente.pacienteUsuarioId || null);
    setAnamneseLiberadaPaciente(!!paciente.anamneseLiberadaPaciente);
    setCadastroOrigem(
      paciente.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
    );
    setCep(formatCEP(paciente.endereco.cep));
    setRua(paciente.endereco.rua);
    setNumero(paciente.endereco.numero);
    setComplemento(paciente.endereco.complemento || "");
    setBairro(paciente.endereco.bairro);
    setCidade(paciente.endereco.cidade);
    setUf(paciente.endereco.uf);
  }, [
    getPacienteById,
    isEditing,
    isSelfEditMode,
    routePacienteId,
    showToast,
    usuario?.email,
    usuario?.nome,
  ]);

  useEffect(() => {
    if (isSelfEditMode) return;
    if (isUuid(routePacienteId)) {
      setCurrentPacienteId(routePacienteId);
    }
  }, [isSelfEditMode, routePacienteId]);

  // Salvar

  const buildInviteMessage = (link: string) => {
    const nome = nomeCompleto.trim() || t("patientForm.patientFallback");
    const emailContato = email.trim().toLowerCase();
    const lines = [
      t("patientForm.inviteHello", { name: nome }),
      t("patientForm.inviteReceived"),
      emailContato
        ? t("patientForm.inviteUseEmail", { email: emailContato })
        : null,
      t("patientForm.inviteLinkLine", { link }),
      t("patientForm.inviteQuestions"),
    ].filter(Boolean);
    return lines.join("\n\n");
  };
  const gerarLinkConvitePaciente = async (pacienteId: string) => {
    const response = await api.post<PacienteInviteCreateResponse>(
      "/auth/paciente-convite",
      { pacienteId, diasExpiracao: 7 },
    );
    return response.data.link;
  };

  const abrirWhatsappComLink = async (link: string) => {
    const text = encodeURIComponent(buildInviteMessage(link));
    const url = `https://wa.me/?text=${text}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error(t("patientForm.whatsappUnavailable"));
    }
    await Linking.openURL(url);
  };

  const abrirEmailComLink = async (link: string) => {
    const subject = encodeURIComponent(t("patientForm.inviteEmailSubject"));
    const body = encodeURIComponent(buildInviteMessage(link));
    const recipient = email.trim();
    const url = `mailto:${recipient}?subject=${subject}&body=${body}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error(t("patientForm.emailAppUnavailable"));
    }
    await Linking.openURL(url);
  };

  const compartilharConviteSistema = async (link: string) => {
    await Share.share({
      message: buildInviteMessage(link),
    });
  };

  const enviarConviteRapidoPosCadastro = async (link: string) => {
    const hasWhatsapp = !!whatsapp.trim();
    const hasEmail = !!email.trim();

    const executarComFallback = async (acao: () => Promise<void>) => {
      try {
        await acao();
        showToast({
          message: t("patientForm.inviteGeneratedSuccess"),
          type: "success",
        });
      } catch (error) {
        const { message } = parseApiError(error);
        showToast({ message, type: "error" });
        try {
          await compartilharConviteSistema(link);
        } catch {
          showToast({ message: t("patientForm.inviteShareError"), type: "error" });
        }
      }
    };

    if (hasWhatsapp && hasEmail) {
      if (Platform.OS === "web") {
        // Alert com múltiplas ações pode não resolver a promise no web.
        await executarComFallback(() => compartilharConviteSistema(link));
        return;
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        Alert.alert(
          "Enviar convite",
          "Como deseja enviar o convite para o paciente?",
          [
            {
              text: "Depois",
              style: "cancel",
              onPress: () => done(),
            },
            {
              text: "WhatsApp",
              onPress: () => {
                void (async () => {
                  await executarComFallback(() => abrirWhatsappComLink(link));
                  done();
                })();
              },
            },
            {
              text: "E-mail",
              onPress: () => {
                void (async () => {
                  await executarComFallback(() => abrirEmailComLink(link));
                  done();
                })();
              },
            },
            {
              text: "Compartilhar",
              onPress: () => {
                void (async () => {
                  await executarComFallback(() => compartilharConviteSistema(link));
                  done();
                })();
              },
            },
          ],
        );
      });
      return;
    }

    if (hasWhatsapp) {
      await executarComFallback(() => abrirWhatsappComLink(link));
      return;
    }

    if (hasEmail) {
      await executarComFallback(() => abrirEmailComLink(link));
      return;
    }

    await executarComFallback(() => compartilharConviteSistema(link));
  };

  const buildPacientePayloadFromForm = () => ({
    nomeCompleto,
    cpf: cpf.replace(/\D/g, ""),
    dataNascimento: toApiDate(dataNascimento),
    sexo: sexo!,
    estadoCivil: estadoCivil || undefined,
    profissao: sanitizeProfissao(profissao),
    contato: {
      whatsapp: whatsapp.replace(/\D/g, ""),
      email: email || undefined,
    },
    endereco: {
      cep: cep.replace(/\D/g, ""),
      rua,
      numero,
      complemento: complemento || undefined,
      bairro,
      cidade,
      uf,
    },
    pacienteUsuarioId: pacienteUsuarioId || undefined,
    anamneseLiberadaPaciente,
    cadastroOrigem,
  });

  const mapPayloadToApi = (payload: ReturnType<typeof buildPacientePayloadFromForm>) => ({
    nomeCompleto: payload.nomeCompleto,
    cpf: payload.cpf,
    dataNascimento: payload.dataNascimento,
    sexo: payload.sexo,
    estadoCivil: payload.estadoCivil || undefined,
    profissao: payload.profissao || undefined,
    enderecoRua: payload.endereco.rua,
    enderecoNumero: payload.endereco.numero,
    enderecoComplemento: payload.endereco.complemento || undefined,
    enderecoBairro: payload.endereco.bairro,
    enderecoCep: payload.endereco.cep,
    enderecoCidade: payload.endereco.cidade,
    enderecoUf: payload.endereco.uf,
    contatoWhatsapp: payload.contato.whatsapp,
    contatoEmail: payload.contato.email || undefined,
    pacienteUsuarioId: payload.pacienteUsuarioId || undefined,
    anamneseLiberadaPaciente: payload.anamneseLiberadaPaciente ?? false,
    cadastroOrigem: payload.cadastroOrigem || PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
  });

  const handleSave = async () => {
    if (!validate()) {
      trackEvent("patient_form_validation_failed", {
        mode: isQuickInviteMode ? "CONVITE_RAPIDO" : "CADASTRO_ASSISTIDO",
        isEditing,
        fields: Object.keys(errors),
      }).catch(() => undefined);
      return;
    }

    setLoading(true);
    trackEvent("patient_form_submit_started", {
      mode: isQuickInviteMode ? "CONVITE_RAPIDO" : "CADASTRO_ASSISTIDO",
      isEditing,
    }).catch(() => undefined);

    try {
      if (isSelfEditMode) {
        const pacienteData = buildPacientePayloadFromForm();
        await api.patch("/pacientes/me", mapPayloadToApi(pacienteData), {
          timeout: 45000,
        });
        showToast({
          message: t("patientForm.updatedSuccess"),
          type: "success",
        });
        navigation.goBack();
        return;
      }

      if (isQuickInviteMode) {
        if (isEditing && isUuid(routePacienteId)) {
          const pacienteAtualizado = await updatePaciente(
            routePacienteId,
            buildPacientePayloadFromForm() as any,
          );
          const link = await gerarLinkConvitePaciente(routePacienteId);
          await enviarConviteRapidoPosCadastro(link);
          showToast({
            message: t("patientForm.updatedSuccess"),
            type: "success",
          });
          trackEvent("patient_form_submit_succeeded", {
            mode: "CONVITE_RAPIDO",
            isEditing: true,
            pacienteId: pacienteAtualizado?.id || routePacienteId,
          }).catch(() => undefined);
          navigation.goBack();
          return;
        }

        const response = await api.post<
          PacienteInviteCreateResponse & { pacienteId: string }
        >("/auth/paciente-convite-rapido", {
          nome: nomeCompleto.trim(),
          whatsapp: whatsapp.replace(/\D/g, "") || undefined,
          email: email.trim() || undefined,
          diasExpiracao: 7,
        });
        if (response.data.pacienteId) {
          setCurrentPacienteId(response.data.pacienteId);
        }

        await enviarConviteRapidoPosCadastro(response.data.link);
        trackEvent("patient_form_submit_succeeded", {
          mode: "CONVITE_RAPIDO",
          isEditing,
        }).catch(() => undefined);
        navigation.goBack();
        return;
      }

      const pacienteData = buildPacientePayloadFromForm();

      let pacientePersistido;
      if (isEditing && isUuid(routePacienteId)) {
        pacientePersistido = await updatePaciente(
          routePacienteId,
          pacienteData as any,
        );
      } else {
        pacientePersistido = await createPaciente(pacienteData as any);
      }

      if (pacientePersistido?.id) {
        setCurrentPacienteId(pacientePersistido.id);
        navigation.setParams({ pacienteId: pacientePersistido.id });
      }

      showToast({
        message: isEditing
          ? t("patientForm.updatedSuccess")
          : t("patientForm.createdSuccess"),
        type: "success",
      });
      trackEvent("patient_form_submit_succeeded", {
        mode: "CADASTRO_ASSISTIDO",
        isEditing,
        pacienteId: pacientePersistido?.id,
      }).catch(() => undefined);

      const hasContatoParaConvite = !!whatsapp.trim() || !!email.trim();
      const podeOferecerConviteAgora =
        !isEditing &&
        !isQuickInviteMode &&
        !!pacientePersistido?.id &&
        hasContatoParaConvite;

      if (podeOferecerConviteAgora) {
        const pacienteId = String(pacientePersistido.id);
        Alert.alert(
          "Enviar convite agora?",
          "Paciente cadastrado com sucesso. Deseja enviar o link de cadastro agora?",
          [
            {
              text: "Depois",
              style: "cancel",
              onPress: () => navigation.goBack(),
            },
            {
              text: "WhatsApp",
              onPress: () => {
                void (async () => {
                  try {
                    const link = await gerarLinkConvitePaciente(pacienteId);
                    await abrirWhatsappComLink(link);
                    showToast({
                      message: t("patientForm.inviteGeneratedSuccess"),
                      type: "success",
                    });
                  } catch (error) {
                    const { message } = parseApiError(error);
                    showToast({
                      message:
                        "Paciente cadastrado com sucesso, mas o convite não foi enviado. " + message,
                      type: "error",
                    });
                  } finally {
                    navigation.goBack();
                  }
                })();
              },
            },
            {
              text: "E-mail",
              onPress: () => {
                void (async () => {
                  try {
                    const link = await gerarLinkConvitePaciente(pacienteId);
                    await abrirEmailComLink(link);
                    showToast({
                      message: t("patientForm.inviteGeneratedSuccess"),
                      type: "success",
                    });
                  } catch (error) {
                    const { message } = parseApiError(error);
                    showToast({
                      message:
                        "Paciente cadastrado com sucesso, mas o convite não foi enviado. " + message,
                      type: "error",
                    });
                  } finally {
                    navigation.goBack();
                  }
                })();
              },
            },
          ],
        );
        return;
      }

      navigation.goBack();
    } catch (error: any) {
      const { message, fieldErrors } = parseApiError(error);
      trackEvent("patient_form_submit_failed", {
        mode: isQuickInviteMode ? "CONVITE_RAPIDO" : "CADASTRO_ASSISTIDO",
        isEditing,
        error: message,
      }).catch(() => undefined);
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;

    const pacienteIdToDelete = (currentPacienteId || routePacienteId || "").trim();
    if (!isUuid(pacienteIdToDelete)) {
      showToast({
        message: t("patientForm.deleteError"),
        type: "error",
      });
      return;
    }

    const paciente = getPacienteById(pacienteIdToDelete);
    const nomePaciente = paciente?.nomeCompleto || t("patientForm.thisPatient");

    const navigateAfterDelete = () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        try {
          window.location.assign("/pacientes");
          return;
        } catch {
          // fallback para navegacao SPA abaixo
        }
      }

      try {
        navigation.navigate("PacientesList");
      } catch {
        // noop
      }

      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "PacientesList" }],
          }),
        );
      } catch {
        // noop
      }

      if (Platform.OS === "web" && typeof window !== "undefined") {
        try {
          window.history.replaceState({}, "", "/pacientes");
        } catch {
          // noop
        }
      }
    };

    const executeDelete = async () => {
      try {
        setLoading(true);
        await deletePaciente(pacienteIdToDelete);
        trackEvent("patient_deleted", {
          pacienteId: pacienteIdToDelete,
          source: "PacienteFormScreen",
        }).catch(() => undefined);
        showToast({
          message: t("patientForm.deletedSuccess"),
          type: "success",
        });
        navigateAfterDelete();
      } catch (error) {
        const { message } = parseApiError(error);
        trackEvent("patient_delete_failed", {
          pacienteId: pacienteIdToDelete,
          error: message,
          source: "PacienteFormScreen",
        }).catch(() => undefined);
        showToast({
          message: message || t("patientForm.deleteError"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      const confirmMessage = t("patientForm.confirmDeleteMessage", { name: nomePaciente });
      if (typeof globalThis.confirm === "function" && !globalThis.confirm(confirmMessage)) {
        return;
      }
      void executeDelete();
      return;
    }

    Alert.alert(
      t("patientForm.confirmDeleteTitle"),
      t("patientForm.confirmDeleteMessage", { name: nomePaciente }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("patientForm.delete"),
          style: "destructive",
          onPress: () => {
            void executeDelete();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!isSelfEditMode ? (
          <FormSection title="Modo de cadastro">
            <Text style={styles.hintText}>
              Escolha se o cadastro será completo pelo profissional ou apenas
              convite rápido para o paciente concluir no app.
            </Text>
            <View style={styles.optionsRow}>
              <SelectOption
                label="Cadastro assistido"
                selected={
                  cadastroOrigem === PacienteCadastroOrigem.CADASTRO_ASSISTIDO
                }
                onPress={() =>
                  setCadastroOrigem(PacienteCadastroOrigem.CADASTRO_ASSISTIDO)
                }
              />
              <SelectOption
                label="Convite rápido"
                selected={
                  cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO
                }
                onPress={() =>
                  setCadastroOrigem(PacienteCadastroOrigem.CONVITE_RAPIDO)
                }
              />
            </View>
          </FormSection>
        ) : null}

        {!isQuickInviteMode ? (
          <>
            <FormSection title={t("patientForm.personalData")}>
              <Input
                label={t("patientForm.fullNameLabel")}
                placeholder={t("patientForm.fullNamePlaceholder")}
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
                error={errors.nomeCompleto}
                leftIcon="person-outline"
                autoCapitalize="words"
              />
              <Input
                label={t("patientForm.cpfLabel")}
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                error={errors.cpf}
                keyboardType="numeric"
                maxLength={14}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label={t("patientForm.birthLabel")}
                    placeholder="DD/MM/AAAA"
                    value={dataNascimento}
                    onChangeText={(text) => setDataNascimento(formatDate(text))}
                    error={errors.dataNascimento}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <View style={styles.spacer} />
                <View style={styles.flex1}>
                  <Input
                    label={t("patientForm.professionLabel")}
                    placeholder={t("patientForm.professionPlaceholder")}
                    value={profissao}
                    onChangeText={setProfissao}
                  />
                </View>
              </View>

              <Text style={styles.label}>{t("patientForm.sexLabel")}</Text>
              {errors.sexo && <Text style={styles.errorText}>{errors.sexo}</Text>}
              <View style={styles.optionsRow}>
                <SelectOption
                  label="Masculino"
                  selected={sexo === Sexo.MASCULINO}
                  onPress={() => setSexo(Sexo.MASCULINO)}
                />
                <SelectOption
                  label="Feminino"
                  selected={sexo === Sexo.FEMININO}
                  onPress={() => setSexo(Sexo.FEMININO)}
                />
                <SelectOption
                  label={t("patientForm.sexOther")}
                  selected={sexo === Sexo.OUTRO}
                  onPress={() => setSexo(Sexo.OUTRO)}
                />
              </View>

              <Text style={styles.label}>{t("patientForm.maritalStatusLabel")}</Text>
              <View style={styles.optionsRow}>
                <SelectOption
                  label={t("patientForm.maritalSingle")}
                  selected={estadoCivil === EstadoCivil.SOLTEIRO}
                  onPress={() => setEstadoCivil(EstadoCivil.SOLTEIRO)}
                />
                <SelectOption
                  label={t("patientForm.maritalMarried")}
                  selected={estadoCivil === EstadoCivil.CASADO}
                  onPress={() => setEstadoCivil(EstadoCivil.CASADO)}
                />
                <SelectOption
                  label={t("patientForm.maritalDivorced")}
                  selected={estadoCivil === EstadoCivil.DIVORCIADO}
                  onPress={() => setEstadoCivil(EstadoCivil.DIVORCIADO)}
                />
              </View>
              <View style={styles.optionsRow}>
                <SelectOption
                  label={t("patientForm.maritalWidowed")}
                  selected={estadoCivil === EstadoCivil.VIUVO}
                  onPress={() => setEstadoCivil(EstadoCivil.VIUVO)}
                />
                <SelectOption
                  label={t("patientForm.maritalStableUnion")}
                  selected={estadoCivil === EstadoCivil.UNIAO_ESTAVEL}
                  onPress={() => setEstadoCivil(EstadoCivil.UNIAO_ESTAVEL)}
                />
              </View>
            </FormSection>

            <FormSection title={t("patientDetails.address")}>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label={t("patientForm.cepLabel")}
                    placeholder="00000-000"
                    value={cep}
                    onChangeText={(text) => setCep(formatCEP(text))}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                </View>
                <View style={styles.spacer} />
                <TouchableOpacity style={styles.cepButton} onPress={buscarCEP}>
                  <Ionicons name="search" size={20} color={COLORS.white} />
                  <Text style={styles.cepButtonText}>
                    {t("patientForm.searchCep")}
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label={t("patientForm.streetLabel")}
                placeholder={t("patientForm.streetPlaceholder")}
                value={rua}
                onChangeText={setRua}
              />

              <View style={styles.row}>
                <View style={{ width: 100 }}>
                  <Input
                    label={t("patientForm.numberLabel")}
                    placeholder={t("patientForm.numberPlaceholder")}
                    value={numero}
                    onChangeText={setNumero}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.spacer} />
                <View style={styles.flex1}>
                  <Input
                    label={t("patientForm.complementLabel")}
                    placeholder={t("patientForm.complementPlaceholder")}
                    value={complemento}
                    onChangeText={setComplemento}
                  />
                </View>
              </View>

              <Input
                label={t("patientForm.neighborhoodLabel")}
                placeholder={t("patientForm.neighborhoodPlaceholder")}
                value={bairro}
                onChangeText={setBairro}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label={t("patientForm.cityLabel")}
                    placeholder={t("patientForm.cityPlaceholder")}
                    value={cidade}
                    onChangeText={setCidade}
                  />
                </View>
                <View style={styles.spacer} />
                <View style={{ width: 80 }}>
                  <Input
                    label={t("patientForm.ufLabel")}
                    placeholder={t("patientForm.ufPlaceholder")}
                    value={uf}
                    onChangeText={(text) => setUf(text.toUpperCase())}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </FormSection>
          </>
        ) : null}

        <FormSection title={t("patientDetails.contact")}>
          {isQuickInviteMode ? (
            <Input
              label={t("patientForm.fullNameLabel")}
              placeholder={t("patientForm.fullNamePlaceholder")}
              value={nomeCompleto}
              onChangeText={setNomeCompleto}
              error={errors.nomeCompleto}
              leftIcon="person-outline"
              autoCapitalize="words"
            />
          ) : null}

          <Input
            label={t("patientForm.whatsappLabel")}
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChangeText={(text) => setWhatsapp(formatPhone(text))}
            error={errors.whatsapp}
            keyboardType="phone-pad"
            leftIcon="logo-whatsapp"
            maxLength={15}
          />

          <Input
            label={t("patientForm.emailLabel")}
            placeholder={t("patientForm.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />
        </FormSection>
        <View style={styles.buttonsContainer}>
          <Button
            title={t("common.cancel")}
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={isEditing ? t("patientForm.update") : t("home.register")}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
        {isEditing && !isSelfEditMode && (
          <Button
            title={t("patientForm.deletePatient")}
            onPress={handleDelete}
            variant="outline"
            style={styles.deleteButton}
            icon={
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            }
            textStyle={styles.deleteButtonText}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.base,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  sectionContent: {},
  hintText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  accessStep: {
    gap: SPACING.xs,
  },
  accessStepTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  selectOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  selectOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  selectOptionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
  },
  selectOptionTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  cepButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    height: 48,
    marginTop: 24,
    gap: SPACING.xs,
  },
  cepButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  deleteButton: {
    borderColor: COLORS.error,
    marginBottom: SPACING.xl,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontWeight: "600",
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.success + "22",
    borderWidth: 1,
    borderColor: COLORS.success + "55",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  linkedBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    fontWeight: "600",
  },
  vinculoActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  vincularButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 140,
  },
  vincularButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  removerVinculoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  removerVinculoButtonText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
    overflow: "hidden",
  },
  suggestionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  suggestionLoadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
  suggestionEmail: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  inviteDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.base,
  },
  inviteButtonsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inviteActionButton: {
    flex: 1,
  },
});
























