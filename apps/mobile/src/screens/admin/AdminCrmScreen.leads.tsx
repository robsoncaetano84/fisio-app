import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import type {
  CrmInteraction,
  CrmInteractionType,
  CrmLead,
  CrmLeadChannel,
  CrmLeadStage,
} from "../../services/crm";
import {
  Action,
  Chip,
  MetricMini,
  SmallBtn,
} from "./AdminCrmScreen.components";
import { CHANNELS, STAGES } from "./AdminCrmScreen.constants";
import { styles } from "./AdminCrmScreen.styles";
import { dt, money } from "./AdminCrmScreen.utils";

type LeadForm = {
  id: string;
  nome: string;
  empresa: string;
  canal: CrmLeadChannel;
  stage: CrmLeadStage;
  valor: string;
};

type LeadsTabProps = {
  leads: CrmLead[];
  selectedLeadId: string;
  selectedLead: CrmLead | null;
  form: LeadForm;
  stageLabel: Record<CrmLeadStage, string>;
  interactionLabel: Record<CrmInteractionType, string>;
  interactions: CrmInteraction[];
  loadingInteractions: boolean;
  onExportCurrent: () => void;
  onExportAll: () => void;
  onSelectLead: (leadId: string) => void;
  onEditLead: (form: LeadForm) => void;
  onAdvanceLead: (lead: CrmLead) => void;
  onDeleteLead: (lead: CrmLead) => void;
  onFormChange: (patch: Partial<LeadForm>) => void;
  onSave: () => void;
  onReset: () => void;
};

export function LeadsTab({
  leads,
  selectedLeadId,
  selectedLead,
  form,
  stageLabel,
  interactionLabel,
  interactions,
  loadingInteractions,
  onExportCurrent,
  onExportAll,
  onSelectLead,
  onEditLead,
  onAdvanceLead,
  onDeleteLead,
  onFormChange,
  onSave,
  onReset,
}: LeadsTabProps) {
  const { t } = useLanguage();

  return (
    <>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.section}>{t("crm.sections.leadFunnel")}</Text>
          <View style={styles.wrapRow}>
            <Action
              title={t("crm.actions.exportCsv")}
              secondary
              onPress={onExportCurrent}
            />
            <Action
              title={t("crm.actions.exportAllLeads")}
              secondary
              onPress={onExportAll}
            />
          </View>
        </View>
        <View style={styles.kanbanWrap}>
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);
            return (
              <View key={stage} style={styles.kanbanCol}>
                <Text style={styles.lineTitle}>{stageLabel[stage]}</Text>
                <Text style={styles.lineSub}>{stageLeads.length} leads</Text>
                {stageLeads.map((lead) => (
                  <Pressable
                    key={lead.id}
                    style={[
                      styles.kanbanCard,
                      selectedLeadId === lead.id && styles.selected,
                    ]}
                    onPress={() => onSelectLead(lead.id)}
                  >
                    <Text style={styles.lineTitle}>{lead.nome}</Text>
                    <Text style={styles.lineSub}>
                      {lead.empresa || t("crm.messages.individualPerson")}{" "}
                      {"\u2022"} {money(lead.valorPotencial)}
                    </Text>
                    <View style={styles.wrapRow}>
                      <SmallBtn
                        title={t("crm.actions.edit")}
                        onPress={() =>
                          onEditLead({
                            id: lead.id,
                            nome: lead.nome,
                            empresa: lead.empresa || "",
                            canal: lead.canal,
                            stage: lead.stage,
                            valor: String(lead.valorPotencial || ""),
                          })
                        }
                      />
                      <SmallBtn
                        title={t("crm.actions.advanceStage")}
                        onPress={() => onAdvanceLead(lead)}
                      />
                      <SmallBtn
                        danger
                        title={t("crm.actions.delete")}
                        onPress={() => onDeleteLead(lead)}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.split}>
        <View style={styles.pane}>
          <Text style={styles.section}>
            {form.id ? t("crm.forms.editLeadTitle") : t("crm.forms.createLeadTitle")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("crm.placeholders.name")}
            value={form.nome}
            onChangeText={(nome) => onFormChange({ nome })}
          />
          <TextInput
            style={styles.input}
            placeholder={t("crm.placeholders.company")}
            value={form.empresa}
            onChangeText={(empresa) => onFormChange({ empresa })}
          />
          <View style={styles.wrapRow}>
            {CHANNELS.map((channel) => (
              <Chip
                key={channel}
                label={channel}
                active={form.canal === channel}
                onPress={() => onFormChange({ canal: channel })}
              />
            ))}
          </View>
          <View style={styles.wrapRow}>
            {STAGES.map((stage) => (
              <Chip
                key={stage}
                label={stageLabel[stage]}
                active={form.stage === stage}
                onPress={() => onFormChange({ stage })}
              />
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder={t("crm.labels.potentialValue")}
            value={form.valor}
            onChangeText={(valor) => onFormChange({ valor })}
          />
          <View style={styles.wrapRow}>
            <Action
              title={form.id ? t("crm.forms.saveLead") : t("crm.forms.createLead")}
              onPress={onSave}
            />
            <Action title={t("crm.actions.clear")} secondary onPress={onReset} />
          </View>
        </View>
        <View style={styles.pane}>
          <Text style={styles.section}>{t("crm.sections.leadPanel")}</Text>
          {selectedLead ? (
            <>
              <Text style={styles.big}>{selectedLead.nome}</Text>
              <Text style={styles.sub}>
                {selectedLead.empresa || t("crm.messages.individualPerson")}{" "}
                {"\u2022"} {stageLabel[selectedLead.stage]}
              </Text>
              <View style={styles.wrapRow}>
                <MetricMini
                  label={t("crm.labels.channel")}
                  value={selectedLead.canal}
                />
                <MetricMini
                  label={t("crm.labels.value")}
                  value={money(selectedLead.valorPotencial)}
                />
              </View>
              <Text style={[styles.section, { marginTop: 12 }]}>
                {t("crm.labels.recentInteractions")}
              </Text>
              {loadingInteractions ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                interactions.slice(0, 6).map((interaction) => (
                  <View key={interaction.id} style={styles.line}>
                    <Text style={styles.lineTitle}>
                      {interactionLabel[interaction.tipo]}
                    </Text>
                    <Text style={styles.lineSub}>
                      {interaction.resumo} {"\u2022"}{" "}
                      {dt(interaction.occurredAt)}
                    </Text>
                  </View>
                ))
              )}
            </>
          ) : (
            <Text style={styles.muted}>{t("crm.messages.selectLead")}</Text>
          )}
        </View>
      </View>
    </>
  );
}
