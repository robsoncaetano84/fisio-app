import React from "react";
import { Text, TextInput, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { CrmLeadStage } from "../../services/crm";
import {
  Action,
  Chip,
  MetricMini,
  MiniTab,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type { PacRow } from "./AdminCrmScreen.utils";

type PatientDetailTab = "RESUMO" | "CONTATO" | "VINCULO";

type PatientEditForm = {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  contatoWhatsapp: string;
  contatoTelefone: string;
  contatoEmail: string;
  enderecoCidade: string;
  enderecoUf: string;
  ativo: boolean;
};

type PatientDetailPanelProps = {
  patient: PacRow | null;
  editOpen: boolean;
  editForm: PatientEditForm;
  saving: boolean;
  detailTab: PatientDetailTab;
  stageLabel: Record<CrmLeadStage, string>;
  onToggleEdit: () => void;
  onEditFormChange: (patch: Partial<PatientEditForm>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDetailTabChange: (tab: PatientDetailTab) => void;
  onOpenInFunnel: () => void;
  onRegisterInteraction: () => void;
};

export function PatientDetailPanel({
  patient,
  editOpen,
  editForm,
  saving,
  detailTab,
  stageLabel,
  onToggleEdit,
  onEditFormChange,
  onSave,
  onCancel,
  onDetailTabChange,
  onOpenInFunnel,
  onRegisterInteraction,
}: PatientDetailPanelProps) {
  const { t } = useLanguage();

  return (
    <View style={[styles.pane, styles.detailPane]}>
      <Text style={styles.section}>{t("crm.sections.patientPanel")}</Text>
      {patient ? (
        <>
          <View style={styles.entityHeader}>
            <View style={styles.entityHeaderText}>
              <Text style={styles.entityName}>{patient.nome}</Text>
              <Text style={styles.entityMeta}>
                {t("crm.labels.professional")}: {patient.profissionalNome}
              </Text>
            </View>
            <Action
              title={
                editOpen ? t("crm.actions.closeEdit") : t("crm.actions.editPatient")
              }
              secondary
              style={styles.entityHeaderAction}
              onPress={onToggleEdit}
            />
          </View>
          {editOpen ? (
            <PatientEditFormFields
              form={editForm}
              saving={saving}
              onChange={onEditFormChange}
              onSave={onSave}
              onCancel={onCancel}
            />
          ) : null}
          <View style={styles.panelTabsRow}>
            <MiniTab
              label={t("crm.labels.summary")}
              active={detailTab === "RESUMO"}
              onPress={() => onDetailTabChange("RESUMO")}
            />
            <MiniTab
              label={t("crm.labels.contact")}
              active={detailTab === "CONTATO"}
              onPress={() => onDetailTabChange("CONTATO")}
            />
            <MiniTab
              label={t("crm.labels.link")}
              active={detailTab === "VINCULO"}
              onPress={() => onDetailTabChange("VINCULO")}
            />
          </View>
          <View style={styles.panelMetricsRow}>
            <MetricMini label={t("crm.labels.status")} value={patient.status} />
            <MetricMini
              label={t("crm.labels.adherence")}
              value={`${patient.adesao}%`}
            />
            <MetricMini
              label={t("crm.labels.channel")}
              value={patient.lead.canal}
            />
            <MetricMini
              label={t("crm.labels.stage")}
              value={stageLabel[patient.lead.stage]}
            />
            {patient.emocionalVulneravel ? (
              <MetricMini
                label={t("crm.labels.emotional")}
                value={t("crm.badges.emotionalAttention")}
              />
            ) : null}
          </View>
          {patient.emocionalVulneravel && patient.emocionalResumo ? (
            <View style={styles.line}>
              <Text style={styles.lineTitle}>
                {t("crm.labels.emotionalVulnerability")}
              </Text>
              <Text style={styles.lineSub}>
                {buildEmotionalSummary(patient) ||
                  "Sinais de vulnerabilidade na \u00faltima anamnese"}
              </Text>
            </View>
          ) : null}
          {detailTab === "RESUMO" ? (
            <View style={styles.panelPrimaryActions}>
              <Action title={t("crm.actions.openInFunnel")} onPress={onOpenInFunnel} />
              <Action
                title={t("crm.actions.registerInteraction")}
                secondary
                onPress={onRegisterInteraction}
              />
            </View>
          ) : null}
          {detailTab === "CONTATO" ? <PatientContactPanel patient={patient} /> : null}
          {detailTab === "VINCULO" ? <PatientLinkPanel patient={patient} /> : null}
        </>
      ) : (
        <Text style={styles.muted}>{t("crm.messages.selectPatient")}</Text>
      )}
    </View>
  );
}

function PatientEditFormFields({
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  form: PatientEditForm;
  saving: boolean;
  onChange: (patch: Partial<PatientEditForm>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.line}>
      <Text style={styles.panelFormTitle}>{t("crm.forms.editPatientData")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.fullName")}
        value={form.nomeCompleto}
        onChangeText={(nomeCompleto) => onChange({ nomeCompleto })}
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.cpf11")}
        value={form.cpf}
        onChangeText={(value) =>
          onChange({ cpf: value.replace(/\D/g, "").slice(0, 11) })
        }
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.birthDateIso")}
        value={form.dataNascimento}
        onChangeText={(dataNascimento) => onChange({ dataNascimento })}
      />
      <View style={styles.wrapRow}>
        {["MASCULINO", "FEMININO", "OUTRO"].map((sexo) => (
          <Chip
            key={sexo}
            label={sexo}
            active={form.sexo === sexo}
            onPress={() => onChange({ sexo })}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.profession")}
        value={form.profissao}
        onChangeText={(profissao) => onChange({ profissao })}
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.whatsapp")}
        value={form.contatoWhatsapp}
        onChangeText={(value) =>
          onChange({ contatoWhatsapp: value.replace(/\D/g, "").slice(0, 11) })
        }
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.phone")}
        value={form.contatoTelefone}
        onChangeText={(value) =>
          onChange({ contatoTelefone: value.replace(/\D/g, "").slice(0, 11) })
        }
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.email")}
        value={form.contatoEmail}
        onChangeText={(contatoEmail) => onChange({ contatoEmail })}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.city")}
        value={form.enderecoCidade}
        onChangeText={(enderecoCidade) => onChange({ enderecoCidade })}
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.uf")}
        value={form.enderecoUf}
        onChangeText={(value) =>
          onChange({
            enderecoUf: value
              .toUpperCase()
              .replace(/[^A-Z]/g, "")
              .slice(0, 2),
          })
        }
      />
      <View style={styles.wrapRow}>
        <Chip
          label={t("crm.labels.active")}
          active={form.ativo}
          onPress={() => onChange({ ativo: true })}
        />
        <Chip
          label={t("crm.labels.inactive")}
          active={!form.ativo}
          onPress={() => onChange({ ativo: false })}
        />
      </View>
      <View style={[styles.wrapRow, styles.panelActionsRow]}>
        <Action
          title={saving ? t("crm.actions.saving") : t("crm.actions.saveChanges")}
          onPress={onSave}
          style={styles.panelActionBtn}
        />
        <Action
          title={t("crm.actions.cancel")}
          secondary
          style={styles.panelActionBtn}
          onPress={onCancel}
        />
      </View>
    </View>
  );
}

function PatientContactPanel({ patient }: { patient: PacRow }) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.line}>
        <Text style={styles.lineTitle}>{t("crm.labels.crmChannel")}</Text>
        <Text style={styles.lineSub}>{patient.lead.canal}</Text>
      </View>
      <View style={styles.line}>
        <Text style={styles.lineTitle}>{t("crm.labels.latestCheckin")}</Text>
        <Text style={styles.lineSub}>{patient.ultimoCheckin}</Text>
      </View>
    </>
  );
}

function PatientLinkPanel({ patient }: { patient: PacRow }) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.line}>
        <Text style={styles.lineTitle}>{t("crm.labels.professional")}</Text>
        <Text style={styles.lineSub}>{patient.profissionalNome}</Text>
      </View>
      <View style={styles.line}>
        <Text style={styles.lineTitle}>{t("crm.labels.crmLead")}</Text>
        <Text style={styles.lineSub}>
          {patient.lead.id ? patient.lead.id : t("crm.labels.noLinkedLead")}
        </Text>
      </View>
    </>
  );
}

function buildEmotionalSummary(patient: PacRow) {
  const emotional = patient.emocionalResumo;
  if (!emotional) return "";
  return [
    typeof emotional.estresse === "number"
      ? `Estresse ${emotional.estresse}/10`
      : null,
    typeof emotional.energia === "number"
      ? `Energia ${emotional.energia}/10`
      : null,
    typeof emotional.apoio === "number" ? `Apoio ${emotional.apoio}/10` : null,
    typeof emotional.sonoQualidade === "number"
      ? `Sono ${emotional.sonoQualidade}/10`
      : null,
    emotional.humor ? `Humor ${emotional.humor}` : null,
  ]
    .filter(Boolean)
    .join(" \u2022 ");
}
