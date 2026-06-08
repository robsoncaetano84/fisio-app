import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/theme";
import {
  focusStyle,
  sharedComponentStyles,
} from "./AdminCrmScreen.component-shared";
import { styles } from "./AdminCrmScreen.styles";
import type { TabKey } from "./AdminCrmScreen.types";

export type CrmSectionKey =
  | "OVERVIEW"
  | "OPERACAO"
  | "AUTOMACOES"
  | "PROFISSIONAIS"
  | "PACIENTES"
  | "LEADS"
  | "TAREFAS"
  | "INTERACOES"
  | "EXAMES"
  | "IA_GOVERNANCA"
  | "AUDITORIA";

type SectionMeta = {
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const CRM_SECTION_META: Record<CrmSectionKey, SectionMeta> = {
  OVERVIEW: {
    label: "Visão geral",
    subtitle: "KPIs, busca e filtros globais",
    icon: "grid-outline",
  },
  OPERACAO: {
    label: "Operação clínica",
    subtitle: "Prioridades, pipeline e execução",
    icon: "pulse-outline",
  },
  AUTOMACOES: {
    label: "Automações",
    subtitle: "SLA, ações e histórico",
    icon: "sparkles-outline",
  },
  PROFISSIONAIS: {
    label: "Profissionais",
    subtitle: "Carteira, risco e produtividade",
    icon: "medkit-outline",
  },
  PACIENTES: {
    label: "Pacientes",
    subtitle: "Acompanhamento e vínculo app",
    icon: "people-outline",
  },
  LEADS: {
    label: "Leads e funil",
    subtitle: "Pipeline comercial",
    icon: "git-branch-outline",
  },
  TAREFAS: {
    label: "Tarefas",
    subtitle: "Pendências e agenda operacional",
    icon: "checkmark-done-outline",
  },
  INTERACOES: {
    label: "Interações",
    subtitle: "Histórico de contato",
    icon: "chatbubble-ellipses-outline",
  },
  EXAMES: {
    label: "Analytics clínico",
    subtitle: "Gráficos e exame físico",
    icon: "bar-chart-outline",
  },
  IA_GOVERNANCA: {
    label: "IA e governança",
    subtitle: "Protocolos, consentimentos e IA",
    icon: "shield-checkmark-outline",
  },
  AUDITORIA: {
    label: "Auditoria",
    subtitle: "LGPD e acessos sensíveis",
    icon: "document-text-outline",
  },
};

export const CRM_TAB_SECTION: Record<TabKey, CrmSectionKey> = {
  PROFISSIONAIS: "PROFISSIONAIS",
  PACIENTES: "PACIENTES",
  LEADS: "LEADS",
  TAREFAS: "TAREFAS",
  INTERACOES: "INTERACOES",
};

export const CRM_SECTION_TAB: Partial<Record<CrmSectionKey, TabKey>> = {
  PROFISSIONAIS: "PROFISSIONAIS",
  PACIENTES: "PACIENTES",
  LEADS: "LEADS",
  TAREFAS: "TAREFAS",
  INTERACOES: "INTERACOES",
};

const CRM_NAV_GROUPS: Array<{
  label: string;
  items: CrmSectionKey[];
}> = [
  { label: "Gestão", items: ["OVERVIEW", "OPERACAO", "AUTOMACOES"] },
  { label: "Carteira", items: ["PROFISSIONAIS", "PACIENTES"] },
  { label: "Comercial", items: ["LEADS", "TAREFAS", "INTERACOES"] },
  { label: "Inteligência", items: ["EXAMES", "IA_GOVERNANCA", "AUDITORIA"] },
];

type CrmSidebarProps = {
  activeSection: CrmSectionKey;
  badges: Partial<Record<CrmSectionKey, number | string>>;
  onSectionChange: (section: CrmSectionKey) => void;
};

export function CrmSidebar({
  activeSection,
  badges,
  onSectionChange,
}: CrmSidebarProps) {
  return (
    <View style={styles.crmSidebar}>
      <View style={styles.crmSidebarBrand}>
        <View style={styles.crmSidebarBrandIcon}>
          <Ionicons name="analytics-outline" size={22} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.crmSidebarTitle}>CRM Master</Text>
          <Text style={styles.crmSidebarSubtitle}>Synap clínica</Text>
        </View>
      </View>

      <ScrollView
        style={styles.crmSidebarNav}
        contentContainerStyle={styles.crmSidebarNavContent}
        showsVerticalScrollIndicator={false}
      >
        {CRM_NAV_GROUPS.map((group) => (
          <View key={group.label} style={styles.crmSidebarGroup}>
            <Text style={styles.crmSidebarGroupLabel}>{group.label}</Text>
            {group.items.map((section) => {
              const meta = CRM_SECTION_META[section];
              const active = activeSection === section;
              const badge = badges[section];
              return (
                <Pressable
                  key={section}
                  onPress={() => onSectionChange(section)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={meta.label}
                  style={(state) => [
                    styles.crmSidebarItem,
                    active && styles.crmSidebarItemActive,
                    focusStyle(state),
                  ]}
                >
                  <View
                    style={[
                      styles.crmSidebarIcon,
                      active && styles.crmSidebarIconActive,
                    ]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={18}
                      color={active ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <View style={styles.crmSidebarItemText}>
                    <Text
                      style={[
                        styles.crmSidebarItemLabel,
                        active && styles.crmSidebarItemLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                    <Text style={styles.crmSidebarItemSub} numberOfLines={1}>
                      {meta.subtitle}
                    </Text>
                  </View>
                  {badge !== undefined && badge !== null ? (
                    <View
                      style={[
                        styles.crmSidebarBadge,
                        active && styles.crmSidebarBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.crmSidebarBadgeText,
                          active && styles.crmSidebarBadgeTextActive,
                        ]}
                      >
                        {badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type CrmSectionHeaderProps = {
  section: CrmSectionKey;
  query: string;
  includeSensitiveData: boolean;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  onToggleSensitiveData: () => void;
  onRefresh: () => void;
};

export function CrmSectionHeader({
  section,
  query,
  includeSensitiveData,
  loading,
  onQueryChange,
  onSearchSubmit,
  onToggleSensitiveData,
  onRefresh,
}: CrmSectionHeaderProps) {
  const meta = CRM_SECTION_META[section];
  return (
    <View style={styles.crmPageHeader}>
      <View style={styles.crmPageTitleWrap}>
        <View style={styles.crmPageIcon}>
          <Ionicons name={meta.icon} size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.crmPageTitle}>{meta.label}</Text>
          <Text style={styles.crmPageSubtitle}>{meta.subtitle}</Text>
        </View>
      </View>
      <View style={styles.crmPageHeaderActions}>
        <TextInput
          style={styles.crmPageSearch}
          placeholder="Busca global"
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={onSearchSubmit}
        />
        <Pressable
          onPress={onToggleSensitiveData}
          accessibilityRole="button"
          accessibilityLabel={
            includeSensitiveData
              ? "Ocultar dados sensíveis"
              : "Mostrar dados sensíveis"
          }
          style={(state) => [
            sharedComponentStyles.chip,
            includeSensitiveData && sharedComponentStyles.chipActive,
            focusStyle(state),
          ]}
        >
          <Text
            style={[
              sharedComponentStyles.chipText,
              includeSensitiveData && sharedComponentStyles.chipTextActive,
            ]}
          >
            {includeSensitiveData ? "Sensíveis visíveis" : "Sensíveis ocultos"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Atualizar CRM"
          disabled={loading}
          style={(state) => [
            styles.crmPageRefresh,
            loading && styles.crmPageRefreshDisabled,
            focusStyle(state),
          ]}
        >
          <Ionicons
            name={loading ? "hourglass-outline" : "refresh-outline"}
            size={18}
            color={loading ? "#94A3B8" : COLORS.white}
          />
          <Text
            style={[
              styles.crmPageRefreshText,
              loading && styles.crmPageRefreshTextDisabled,
            ]}
          >
            {loading ? "Carregando" : "Atualizar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
