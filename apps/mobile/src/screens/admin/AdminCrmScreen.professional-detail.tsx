import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  Action,
  Chip,
  KpiCard,
  MiniTab,
  StatusBadge,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type {
  AccountHealthScore,
  EmotionalConcentration,
  PacRow,
  ProfRow,
} from "./AdminCrmScreen.utils";

type ProfessionalDetailTab = "RESUMO" | "PACIENTES";

type ProfessionalEditForm = {
  nome: string;
  email: string;
  especialidade: string;
  registroProf: string;
  ativo: boolean;
};

type ProfessionalDetailPanelProps = {
  professional: ProfRow | null;
  editOpen: boolean;
  editForm: ProfessionalEditForm;
  saving: boolean;
  detailTab: ProfessionalDetailTab;
  accountScore: AccountHealthScore | null;
  emotionalConcentration: EmotionalConcentration | null;
  linkedPatients: PacRow[];
  onToggleEdit: () => void;
  onEditFormChange: (patch: Partial<ProfessionalEditForm>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDetailTabChange: (tab: ProfessionalDetailTab) => void;
  onCreateReactivationTask: () => void;
  onSelectPatient: (patient: PacRow) => void;
};

export function ProfessionalDetailPanel({
  professional,
  editOpen,
  editForm,
  saving,
  detailTab,
  accountScore,
  emotionalConcentration,
  linkedPatients,
  onToggleEdit,
  onEditFormChange,
  onSave,
  onCancel,
  onDetailTabChange,
  onCreateReactivationTask,
  onSelectPatient,
}: ProfessionalDetailPanelProps) {
  const { t } = useLanguage();

  return (
    <View style={[styles.pane, styles.detailPane]}>
      <Text style={styles.section}>{t("crm.sections.professionalPanel")}</Text>
      {professional ? (
        <>
          <View style={styles.entityHeader}>
            <View style={styles.entityHeaderText}>
              <Text style={styles.entityName}>{professional.nome}</Text>
              <Text style={styles.entityMeta}>
                {professional.cidade || t("crm.messages.cityNotProvided")}
              </Text>
            </View>
            <Action
              title={
                editOpen
                  ? t("crm.actions.closeEdit")
                  : t("crm.actions.editProfessional")
              }
              secondary
              style={styles.entityHeaderAction}
              onPress={onToggleEdit}
            />
          </View>
          {editOpen ? (
            <ProfessionalEditFormFields
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
              label={t("crm.sections.patients")}
              active={detailTab === "PACIENTES"}
              onPress={() => onDetailTabChange("PACIENTES")}
            />
          </View>
          <View style={styles.kpiGrid}>
            <KpiCard
              value={professional.pacientes}
              label={t("crm.sections.patients")}
            />
            <KpiCard value={professional.ativos} label={t("crm.labels.active")} />
            <KpiCard
              value={`${professional.adesao}%`}
              label={t("crm.labels.adherence")}
            />
            <KpiCard
              value={accountScore ? accountScore.score : "-"}
              label={t("crm.labels.accountScore")}
            />
          </View>
          {accountScore ? (
            <ProfessionalAccountLine
              score={accountScore}
              emotionalConcentration={emotionalConcentration}
              onCreateReactivationTask={onCreateReactivationTask}
            />
          ) : null}
          {detailTab === "RESUMO" ? (
            <ProfessionalSummary professional={professional} />
          ) : (
            <LinkedPatientsList
              patients={linkedPatients}
              onSelectPatient={onSelectPatient}
            />
          )}
        </>
      ) : (
        <Text style={styles.muted}>{t("crm.messages.selectProfessional")}</Text>
      )}
    </View>
  );
}

function ProfessionalEditFormFields({
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  form: ProfessionalEditForm;
  saving: boolean;
  onChange: (patch: Partial<ProfessionalEditForm>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.line}>
      <Text style={styles.panelFormTitle}>
        {t("crm.forms.editProfessionalData")}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.name")}
        value={form.nome}
        onChangeText={(nome) => onChange({ nome })}
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.email")}
        value={form.email}
        onChangeText={(email) => onChange({ email })}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.specialty")}
        value={form.especialidade}
        onChangeText={(especialidade) => onChange({ especialidade })}
      />
      <TextInput
        style={styles.input}
        placeholder={t("crm.placeholders.professionalRegistry")}
        value={form.registroProf}
        onChangeText={(registroProf) => onChange({ registroProf })}
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

function ProfessionalAccountLine({
  score,
  emotionalConcentration,
  onCreateReactivationTask,
}: {
  score: AccountHealthScore;
  emotionalConcentration: EmotionalConcentration | null;
  onCreateReactivationTask: () => void;
}) {
  const { t } = useLanguage();
  const needsAction = score.status === "RISK" || score.status === "ATTENTION";

  return (
    <View style={styles.line}>
      <View style={[styles.wrapRow, { justifyContent: "space-between" }]}>
        <StatusBadge
          status={score.status}
          labels={{
            healthy: t("crm.badges.accountHealthy"),
            attention: t("crm.status.attention"),
            risk: t("crm.status.risk"),
          }}
        />
        {needsAction ? (
          <Action
            title={t("crm.actions.createReactivationTask")}
            secondary
            onPress={onCreateReactivationTask}
          />
        ) : null}
      </View>
      <Text style={styles.lineTitle}>{t("crm.labels.priorityNow")}</Text>
      <Text style={styles.lineSub}>{score.nextAction}</Text>
      {emotionalConcentration && emotionalConcentration.total > 0 ? (
        <Text style={styles.lineSub}>
          {t("crm.labels.emotionalVulnerability")}:{" "}
          {emotionalConcentration.vulneraveis}/{emotionalConcentration.total} (
          {emotionalConcentration.percentual}%).
        </Text>
      ) : null}
    </View>
  );
}

function ProfessionalSummary({ professional }: { professional: ProfRow }) {
  const { t } = useLanguage();

  return (
    <>
      <Text style={[styles.section, { marginTop: 12 }]}>
        {t("crm.labels.summary")}
      </Text>
      <View style={styles.line}>
        <Text style={styles.lineTitle}>{t("crm.labels.operationalStatus")}</Text>
        <Text style={styles.lineSub}>
          {professional.ativos > 0
            ? t("crm.messages.professionalActive")
            : t("crm.messages.professionalNoActivePatients")}{" "}
          {"\u2022"} {t("crm.labels.lastAccess")} {professional.ultimoAcesso}
        </Text>
      </View>
    </>
  );
}

function LinkedPatientsList({
  patients,
  onSelectPatient,
}: {
  patients: PacRow[];
  onSelectPatient: (patient: PacRow) => void;
}) {
  const { t } = useLanguage();

  return (
    <>
      <Text style={[styles.section, { marginTop: 12 }]}>
        {t("crm.labels.linkedPatients")}
      </Text>
      {patients.slice(0, 8).map((patient) => (
        <Pressable
          key={patient.id}
          style={styles.line}
          onPress={() => onSelectPatient(patient)}
        >
          <Text style={styles.lineTitle}>{patient.nome}</Text>
          <Text style={styles.lineSub}>
            {patient.status} {"\u2022"} {t("crm.labels.adherence").toLowerCase()}{" "}
            {patient.adesao}% {"\u2022"} {patient.ultimoCheckin}
          </Text>
        </Pressable>
      ))}
    </>
  );
}
