import React from "react";
import { TextInput, View } from "react-native";
import type { CrmLeadStage } from "../../services/crm";
import { Chip, Tab } from "./AdminCrmScreen.components";
import { STAGES } from "./AdminCrmScreen.constants";
import { styles } from "./AdminCrmScreen.styles";
import type {
  CrmLeadStageFilter,
  PacEmotionalFilter,
  PacLinkFilter,
  PacStatusFilter,
  ProfAccountStatusFilter,
  ProfActiveFilter,
  ProfEmotionalConcentrationFilter,
  TabKey,
} from "./AdminCrmScreen.types";
import { useLanguage } from "../../i18n/LanguageProvider";

type CrmFiltersCardProps = {
  tabs: Array<{ key: TabKey; label: string }>;
  tab: TabKey;
  showTabs?: boolean;
  stageLabel: Record<CrmLeadStage, string>;
  stageFilter: CrmLeadStageFilter;
  profActiveFilter: ProfActiveFilter;
  profAccountStatusFilter: ProfAccountStatusFilter;
  profEmotionalConcentrationFilter: ProfEmotionalConcentrationFilter;
  profEspecialidadeFilter: string;
  pacStatusFilter: PacStatusFilter;
  pacEmotionalFilter: PacEmotionalFilter;
  pacLinkFilter: PacLinkFilter;
  pacCidadeFilter: string;
  pacUfFilter: string;
  onTabChange: (value: TabKey) => void;
  onStageFilterChange: (value: CrmLeadStageFilter) => void;
  onProfActiveFilterChange: (value: ProfActiveFilter) => void;
  onProfAccountStatusFilterChange: (value: ProfAccountStatusFilter) => void;
  onProfEmotionalConcentrationFilterChange: (
    value: ProfEmotionalConcentrationFilter,
  ) => void;
  onProfEspecialidadeFilterChange: (value: string) => void;
  onPacStatusFilterChange: (value: PacStatusFilter) => void;
  onPacEmotionalFilterChange: (value: PacEmotionalFilter) => void;
  onPacLinkFilterChange: (value: PacLinkFilter) => void;
  onPacCidadeFilterChange: (value: string) => void;
  onPacUfFilterChange: (value: string) => void;
};

export function CrmFiltersCard({
  tabs,
  tab,
  showTabs = true,
  stageLabel,
  stageFilter,
  profActiveFilter,
  profAccountStatusFilter,
  profEmotionalConcentrationFilter,
  profEspecialidadeFilter,
  pacStatusFilter,
  pacEmotionalFilter,
  pacLinkFilter,
  pacCidadeFilter,
  pacUfFilter,
  onTabChange,
  onStageFilterChange,
  onProfActiveFilterChange,
  onProfAccountStatusFilterChange,
  onProfEmotionalConcentrationFilterChange,
  onProfEspecialidadeFilterChange,
  onPacStatusFilterChange,
  onPacEmotionalFilterChange,
  onPacLinkFilterChange,
  onPacCidadeFilterChange,
  onPacUfFilterChange,
}: CrmFiltersCardProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.wrapRow}>
          {showTabs
            ? tabs.map((tabItem) => (
                <Tab
                  key={tabItem.key}
                  label={tabItem.label}
                  active={tab === tabItem.key}
                  onPress={() => onTabChange(tabItem.key)}
                />
              ))
            : null}
        </View>
        <View style={styles.wrapRow}>
          {tab === "PROFISSIONAIS" ? (
            <>
              <Chip
                label={t("crm.filters.allProfessionals")}
                active={profActiveFilter === "TODOS"}
                onPress={() => onProfActiveFilterChange("TODOS")}
              />
              <Chip
                label={t("crm.filters.onlyActive")}
                active={profActiveFilter === "ATIVOS"}
                onPress={() => onProfActiveFilterChange("ATIVOS")}
              />
              <Chip
                label={t("crm.filters.allAccounts")}
                active={profAccountStatusFilter === "TODOS"}
                onPress={() => onProfAccountStatusFilterChange("TODOS")}
              />
              <Chip
                label={t("crm.status.healthy")}
                active={profAccountStatusFilter === "HEALTHY"}
                onPress={() => onProfAccountStatusFilterChange("HEALTHY")}
              />
              <Chip
                label={t("crm.status.attention")}
                active={profAccountStatusFilter === "ATTENTION"}
                onPress={() => onProfAccountStatusFilterChange("ATTENTION")}
              />
              <Chip
                label={t("crm.status.risk")}
                active={profAccountStatusFilter === "RISK"}
                onPress={() => onProfAccountStatusFilterChange("RISK")}
              />
              <Chip
                label={t("crm.filters.profEmotionalAll")}
                active={profEmotionalConcentrationFilter === "TODOS"}
                onPress={() =>
                  onProfEmotionalConcentrationFilterChange("TODOS")
                }
              />
              <Chip
                label={t("crm.filters.profEmotionalHighConcentration")}
                active={profEmotionalConcentrationFilter === "ALTA"}
                onPress={() => onProfEmotionalConcentrationFilterChange("ALTA")}
              />
              <TextInput
                style={styles.filterInput}
                placeholder={t("crm.placeholders.specialty")}
                value={profEspecialidadeFilter}
                onChangeText={onProfEspecialidadeFilterChange}
              />
            </>
          ) : null}
          {tab === "PACIENTES" ? (
            <>
              <Chip
                label={t("crm.filters.statusAll")}
                active={pacStatusFilter === "TODOS"}
                onPress={() => onPacStatusFilterChange("TODOS")}
              />
              <Chip
                label={t("crm.labels.active")}
                active={pacStatusFilter === "ATIVO"}
                onPress={() => onPacStatusFilterChange("ATIVO")}
              />
              <Chip
                label={t("crm.status.risk")}
                active={pacStatusFilter === "RISCO"}
                onPress={() => onPacStatusFilterChange("RISCO")}
              />
              <Chip
                label={t("crm.filters.pacEmotionalAll")}
                active={pacEmotionalFilter === "TODOS"}
                onPress={() => onPacEmotionalFilterChange("TODOS")}
              />
              <Chip
                label={t("crm.filters.pacEmotionalWithVulnerability")}
                active={pacEmotionalFilter === "EMOCIONAL"}
                onPress={() => onPacEmotionalFilterChange("EMOCIONAL")}
              />
              <Chip
                label={t("crm.filters.allPatients")}
                active={pacLinkFilter === "TODOS"}
                onPress={() => onPacLinkFilterChange("TODOS")}
              />
              <Chip
                label={t("crm.filters.linked")}
                active={pacLinkFilter === "VINCULADOS"}
                onPress={() => onPacLinkFilterChange("VINCULADOS")}
              />
              <Chip
                label={t("crm.filters.withoutUser")}
                active={pacLinkFilter === "SEM_USUARIO"}
                onPress={() => onPacLinkFilterChange("SEM_USUARIO")}
              />
              <TextInput
                style={styles.filterInput}
                placeholder={t("crm.placeholders.city")}
                value={pacCidadeFilter}
                onChangeText={onPacCidadeFilterChange}
              />
              <TextInput
                style={[styles.filterInput, { width: 70 }]}
                placeholder={t("crm.placeholders.uf")}
                maxLength={2}
                autoCapitalize="characters"
                value={pacUfFilter}
                onChangeText={onPacUfFilterChange}
              />
            </>
          ) : null}
          <Chip
            label={t("crm.filters.all")}
            active={stageFilter === "TODOS"}
            onPress={() => onStageFilterChange("TODOS")}
          />
          {STAGES.map((stage) => (
            <Chip
              key={stage}
              label={stageLabel[stage]}
              active={stageFilter === stage}
              onPress={() => onStageFilterChange(stage)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
