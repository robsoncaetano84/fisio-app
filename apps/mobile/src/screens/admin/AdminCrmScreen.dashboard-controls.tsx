import React, { type Dispatch, type SetStateAction } from "react";
import { Text, TextInput, View } from "react-native";
import { trackEvent } from "../../services/analytics";
import type {
  CrmClinicalDashboardSummary,
  CrmPipelineSummary,
} from "../../services/crm";
import { Action, Chip, Metric } from "./AdminCrmScreen.components";
import type { ClinicalPipelineStatusFilter, TabKey } from "./AdminCrmScreen.types";
import type { PacRow, ProfRow } from "./AdminCrmScreen.utils";
import { money } from "./AdminCrmScreen.utils";
import { styles } from "./AdminCrmScreen.styles";

type Translate = (
  key: string,
  params?: Record<string, number | string>,
) => string;

type DashboardControlsProps = {
  query: string;
  includeSensitiveData: boolean;
  profs: ProfRow[];
  pacs: PacRow[];
  pipeline: CrmPipelineSummary | null;
  clinicalSummary: CrmClinicalDashboardSummary | null;
  windowDays: number;
  semEvolucaoDias: number;
  clinicalPipelineStatusFilter: ClinicalPipelineStatusFilter;
  onQueryChange: Dispatch<SetStateAction<string>>;
  onToggleSensitiveData: () => void;
  loadMain: () => Promise<void>;
  loadGovernance: () => Promise<void>;
  setTab: Dispatch<SetStateAction<TabKey>>;
  setProfActiveFilter: Dispatch<SetStateAction<"TODOS" | "ATIVOS">>;
  setProfAccountStatusFilter: Dispatch<
    SetStateAction<"TODOS" | "HEALTHY" | "ATTENTION" | "RISK">
  >;
  setProfEmotionalConcentrationFilter: Dispatch<
    SetStateAction<"TODOS" | "ALTA">
  >;
  setPacLinkFilter: Dispatch<
    SetStateAction<"TODOS" | "VINCULADOS" | "SEM_USUARIO">
  >;
  setPacStatusFilter: Dispatch<SetStateAction<"TODOS" | "ATIVO" | "RISCO">>;
  setPacEmotionalFilter: Dispatch<SetStateAction<"TODOS" | "EMOCIONAL">>;
  setWindowDays: Dispatch<SetStateAction<number>>;
  setSemEvolucaoDias: Dispatch<SetStateAction<number>>;
  setClinicalPipelineStatusFilter: Dispatch<
    SetStateAction<ClinicalPipelineStatusFilter>
  >;
  t: Translate;
};

export function AdminCrmDashboardControls({
  query,
  includeSensitiveData,
  profs,
  pacs,
  pipeline,
  clinicalSummary,
  windowDays,
  semEvolucaoDias,
  clinicalPipelineStatusFilter,
  onQueryChange,
  onToggleSensitiveData,
  loadMain,
  loadGovernance,
  setTab,
  setProfActiveFilter,
  setProfAccountStatusFilter,
  setProfEmotionalConcentrationFilter,
  setPacLinkFilter,
  setPacStatusFilter,
  setPacEmotionalFilter,
  setWindowDays,
  setSemEvolucaoDias,
  setClinicalPipelineStatusFilter,
  t,
}: DashboardControlsProps) {
  const activePatientsCount = pacs.filter(
    (patient) => patient.status === "ATIVO",
  ).length;
  const riskPatientsCount = pacs.filter(
    (patient) => patient.status === "RISCO",
  ).length;
  const emotionalPatientsCount = pacs.filter(
    (patient) => patient.emocionalVulneravel,
  ).length;

  return (
    <>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("crm.master.title")}</Text>
          <Text style={styles.sub}>{t("crm.master.subtitle")}</Text>
        </View>
        <TextInput
          style={styles.search}
          placeholder={t("crm.filters.globalSearch")}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={() => loadMain().catch(() => undefined)}
        />
      </View>
      <View style={styles.wrapRow}>
        <Chip
          label={
            includeSensitiveData
              ? t("crm.messages.sensitiveVisible")
              : t("crm.messages.sensitiveHidden")
          }
          active={includeSensitiveData}
          onPress={onToggleSensitiveData}
        />
        <Text style={styles.muted}>
          {includeSensitiveData
            ? t("crm.messages.sensitiveDetailedEnabled")
            : t("crm.messages.sensitiveMaskedDefault")}
        </Text>
        {includeSensitiveData ? (
          <Text style={styles.muted}>
            {t("crm.messages.sensitiveSessionActive")}
          </Text>
        ) : null}
      </View>
      <View style={styles.wrapRow}>
        <Metric
          label={t("crm.sections.professionals")}
          value={String(profs.length)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "professionals",
              targetTab: "PROFISSIONAIS",
              profActiveFilter: "TODOS",
              profAccountStatusFilter: "TODOS",
            }).catch(() => undefined);
            setTab("PROFISSIONAIS");
            setProfActiveFilter("TODOS");
            setProfAccountStatusFilter("TODOS");
            setProfEmotionalConcentrationFilter("TODOS");
          }}
        />
        <Metric
          label={t("crm.sections.patients")}
          value={String(pacs.length)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "patients",
              targetTab: "PACIENTES",
              pacLinkFilter: "TODOS",
            }).catch(() => undefined);
            setTab("PACIENTES");
            setPacLinkFilter("TODOS");
            setPacEmotionalFilter("TODOS");
          }}
        />
        <Metric
          label={t("crm.labels.active")}
          value={String(activePatientsCount)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "patients_active",
              targetTab: "PACIENTES",
              pacStatusFilter: "ATIVO",
              pacLinkFilter: "VINCULADOS",
            }).catch(() => undefined);
            setTab("PACIENTES");
            setPacStatusFilter("ATIVO");
            setPacLinkFilter("VINCULADOS");
            setPacEmotionalFilter("TODOS");
          }}
        />
        <Metric
          label={t("crm.status.risk")}
          value={String(riskPatientsCount)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "patients_risk",
              targetTab: "PACIENTES",
              pacStatusFilter: "RISCO",
            }).catch(() => undefined);
            setTab("PACIENTES");
            setPacStatusFilter("RISCO");
            setPacEmotionalFilter("TODOS");
          }}
        />
        <Metric
          label={t("crm.labels.emotional")}
          value={String(emotionalPatientsCount)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "patients_emotional_vulnerability",
              targetTab: "PACIENTES",
              pacEmotionalFilter: "EMOCIONAL",
            }).catch(() => undefined);
            setTab("PACIENTES");
            setPacEmotionalFilter("EMOCIONAL");
          }}
        />
        <Metric
          label={t("crm.sections.funnel")}
          value={money(pipeline?.totalPipelineValue || 0)}
        />
        <Metric
          label={t("crm.sections.leads")}
          value={String(pipeline?.totalLeads || 0)}
          onPress={() => {
            trackEvent("crm_kpi_clicked", {
              kpi: "leads",
              targetTab: "LEADS",
            }).catch(() => undefined);
            setTab("LEADS");
          }}
        />
      </View>
      <View style={styles.healthKpiBlock}>
        <View style={styles.topRow}>
          <Text style={styles.section}>
            {t("crm.dashboard.operationalClinical")}
          </Text>
          <Text style={styles.muted}>
            {t("crm.messages.careExecutionWindow", { days: windowDays })}
          </Text>
        </View>
        <View style={styles.wrapRow}>
          <Metric
            label={t("crm.status.attention")}
            value={String(clinicalSummary?.metricas.pacientesEmAtencao || 0)}
            onPress={() => {
              setTab("PACIENTES");
              setPacStatusFilter("RISCO");
            }}
          />
          <Metric
            label={t("crm.alerts.noCheckin")}
            value={String(clinicalSummary?.alertas.semCheckin || 0)}
          />
          <Metric
            label={t("crm.messages.noProgressDays", {
              days: semEvolucaoDias,
            })}
            value={String(clinicalSummary?.alertas.semEvolucao || 0)}
          />
          <Metric
            label={t("crm.alerts.pendingAnamnesis")}
            value={String(clinicalSummary?.alertas.anamnesePendente || 0)}
          />
          <Metric
            label={t("crm.alerts.pendingInvite")}
            value={String(clinicalSummary?.alertas.conviteNaoAceito || 0)}
          />
          <Metric
            label={t("crm.metrics.dropout")}
            value={`${clinicalSummary?.metricas.abandonoRate ?? 0}%`}
          />
          <Metric
            label={t("crm.metrics.planCompletion")}
            value={`${clinicalSummary?.metricas.conclusaoPlanoRate ?? 0}%`}
          />
        </View>
      </View>
      <View style={styles.healthKpiBlock}>
        <View style={styles.topRow}>
          <Text style={styles.section}>{t("crm.dashboard.globalFilters")}</Text>
          <Action
            title={t("crm.actions.refresh")}
            secondary
            onPress={() => {
              loadMain().catch(() => undefined);
              loadGovernance().catch(() => undefined);
            }}
          />
        </View>
        <View style={styles.wrapRow}>
          <Text style={styles.muted}>{t("crm.filters.clinicalWindow")}:</Text>
          {[7, 30, 90].map((days) => (
            <Chip
              key={`window-${days}`}
              label={t("crm.messages.daysLabel", { days })}
              active={windowDays === days}
              onPress={() => setWindowDays(days)}
            />
          ))}
        </View>
        <View style={styles.wrapRow}>
          <Text style={styles.muted}>{t("crm.filters.noProgress")}:</Text>
          {[7, 10, 14].map((days) => (
            <Chip
              key={`sem-evo-${days}`}
              label={`>${days}d`}
              active={semEvolucaoDias === days}
              onPress={() => setSemEvolucaoDias(days)}
            />
          ))}
        </View>
        <View style={styles.wrapRow}>
          <Text style={styles.muted}>Status clínico:</Text>
          <Chip
            label={t("crm.filters.all")}
            active={clinicalPipelineStatusFilter === "TODOS"}
            onPress={() => setClinicalPipelineStatusFilter("TODOS")}
          />
          <Chip
            label={t("crm.pipeline.newPatient")}
            active={clinicalPipelineStatusFilter === "NOVO_PACIENTE"}
            onPress={() => setClinicalPipelineStatusFilter("NOVO_PACIENTE")}
          />
          <Chip
            label={t("crm.pipeline.waitingLink")}
            active={clinicalPipelineStatusFilter === "AGUARDANDO_VINCULO"}
            onPress={() =>
              setClinicalPipelineStatusFilter("AGUARDANDO_VINCULO")
            }
          />
          <Chip
            label={t("crm.alerts.pendingAnamnesis")}
            active={clinicalPipelineStatusFilter === "ANAMNESE_PENDENTE"}
            onPress={() =>
              setClinicalPipelineStatusFilter("ANAMNESE_PENDENTE")
            }
          />
          <Chip
            label={t("crm.pipeline.treatment")}
            active={clinicalPipelineStatusFilter === "EM_TRATAMENTO"}
            onPress={() => setClinicalPipelineStatusFilter("EM_TRATAMENTO")}
          />
          <Chip
            label={t("crm.pipeline.discharge")}
            active={clinicalPipelineStatusFilter === "ALTA"}
            onPress={() => setClinicalPipelineStatusFilter("ALTA")}
          />
        </View>
      </View>
    </>
  );
}
