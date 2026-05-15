import React from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";
import type {
  CrmInteraction,
  CrmInteractionType,
  CrmLead,
} from "../../services/crm";
import { Action, Chip, SmallBtn } from "./AdminCrmScreen.components";
import { INTERACTION_TYPES } from "./AdminCrmScreen.constants";
import { styles } from "./AdminCrmScreen.styles";
import { dt } from "./AdminCrmScreen.utils";

type InteractionForm = {
  id: string;
  tipo: CrmInteractionType;
  resumo: string;
};

type InteractionsTabProps = {
  selectedLead: CrmLead | null;
  interactionLabel: Record<CrmInteractionType, string>;
  form: InteractionForm;
  interactions: CrmInteraction[];
  loadingInteractions: boolean;
  onTypeChange: (value: CrmInteractionType) => void;
  onSummaryChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onEdit: (interaction: CrmInteraction) => void;
  onDelete: (interactionId: string) => void;
};

export function InteractionsTab({
  selectedLead,
  interactionLabel,
  form,
  interactions,
  loadingInteractions,
  onTypeChange,
  onSummaryChange,
  onSave,
  onReset,
  onExport,
  onEdit,
  onDelete,
}: InteractionsTabProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.split}>
      <View style={styles.pane}>
        <Text style={styles.section}>{t("crm.actions.registerInteraction")}</Text>
        <Text style={styles.muted}>
          {selectedLead
            ? `Lead: ${selectedLead.nome}`
            : t("crm.messages.selectLeadInFunnel")}
        </Text>
        <View style={styles.wrapRow}>
          {INTERACTION_TYPES.map((type) => (
            <Chip
              key={type}
              label={interactionLabel[type]}
              active={form.tipo === type}
              onPress={() => onTypeChange(type)}
            />
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder={t("crm.forms.summaryPlaceholder")}
          value={form.resumo}
          onChangeText={onSummaryChange}
        />
        <View style={styles.wrapRow}>
          <Action
            title={
              form.id
                ? t("crm.actions.saveInteraction")
                : t("crm.actions.registerInteraction")
            }
            onPress={onSave}
          />
          <Action title={t("crm.actions.clear")} secondary onPress={onReset} />
        </View>
      </View>
      <View style={styles.pane}>
        <View style={styles.topRow}>
          <Text style={styles.section}>
            {t("crm.sections.interactionHistory")}
          </Text>
          <Action title={t("crm.actions.exportCsv")} secondary onPress={onExport} />
        </View>
        {loadingInteractions ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          interactions.map((interaction) => (
            <View key={interaction.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineTitle}>
                  {interactionLabel[interaction.tipo]}
                </Text>
                <Text style={styles.lineSub}>
                  {interaction.resumo} {"\u2022"} {dt(interaction.occurredAt)}
                </Text>
              </View>
              <SmallBtn
                title={t("crm.actions.edit")}
                onPress={() => onEdit(interaction)}
              />
              <SmallBtn
                danger
                title={t("crm.actions.delete")}
                onPress={() => onDelete(interaction.id)}
              />
            </View>
          ))
        )}
      </View>
    </View>
  );
}
