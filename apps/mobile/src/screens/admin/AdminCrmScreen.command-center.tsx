import React from "react";
import { Text, View } from "react-native";
import type {
  CrmAutomationAction,
  CrmCommandCenterItem,
  CrmCommandCenterSummary,
} from "../../services/crm";
import { Action, Metric, SeverityBadge } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";

type CommandCenterPanelProps = {
  summary: CrmCommandCenterSummary | null;
  onActionPress: (item: CrmCommandCenterItem) => void;
  automationActions: CrmAutomationAction[];
  onAutomationPress: (item: CrmAutomationAction) => void;
  onAutomationStatusChange: (
    item: CrmAutomationAction,
    status: "DONE" | "DISMISSED",
  ) => void;
};

export function CommandCenterPanel({
  summary,
  onActionPress,
  automationActions,
  onAutomationPress,
  onAutomationStatusChange,
}: CommandCenterPanelProps) {
  const kpis = summary?.kpis;
  const actions = summary?.nextActions || [];
  const persistedActions = automationActions || [];
  const hasPersistedActions = persistedActions.length > 0;

  return (
    <View style={styles.healthKpiBlock}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.section}>Central operacional</Text>
          <Text style={styles.muted}>
            Prioridades de CRM e acompanhamento clínico
          </Text>
        </View>
        <Text style={styles.muted}>
          {summary ? `Janela: ${summary.windowDays} dias` : "Carregando"}
        </Text>
      </View>

      <View style={styles.wrapRow}>
        <Metric
          label="Ações abertas"
          value={String(kpis?.totalOpenActions || 0)}
        />
        <Metric
          label="Alta prioridade"
          value={String(kpis?.highPriorityActions || 0)}
        />
        <Metric
          label="Tarefas vencidas"
          value={String(kpis?.overdueTasks || 0)}
        />
        <Metric
          label="Pacientes em atenção"
          value={String(
            (kpis?.patientsWithoutEvolution || 0) +
              (kpis?.patientsWithoutCheckin || 0),
          )}
        />
        <Metric label="Leads parados" value={String(kpis?.staleLeads || 0)} />
      </View>

      {hasPersistedActions ? (
        persistedActions.map((item) => (
          <View key={item.id} style={styles.automationItem}>
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <Text style={styles.lineTitle}>{item.title}</Text>
                <SeverityBadge
                  level={item.severity}
                  labels={{ high: "Alta", medium: "Média" }}
                />
              </View>
              <Text style={styles.lineSub}>{item.description}</Text>
              <Text style={styles.lineSub}>
                Status: {formatAutomationStatus(item.status)} • SLA:{" "}
                {formatAutomationDate(item.slaDueAt)} • Histórico:{" "}
                {item.history?.length || 0}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Action
                title={item.ctaLabel}
                onPress={() => onAutomationPress(item)}
                secondary
              />
              <Action
                title="Concluir"
                onPress={() => onAutomationStatusChange(item, "DONE")}
                secondary
              />
              <Action
                title="Dispensar"
                onPress={() => onAutomationStatusChange(item, "DISMISSED")}
                secondary
              />
            </View>
          </View>
        ))
      ) : actions.length === 0 ? (
        <View style={styles.line}>
          <Text style={styles.lineTitle}>Nenhuma ação crítica no momento</Text>
          <Text style={styles.lineSub}>
            As filas de CRM, vínculo e acompanhamento clínico não têm bloqueios
            prioritários nesta janela.
          </Text>
        </View>
      ) : (
        actions.map((item) => (
          <View key={item.id} style={styles.automationItem}>
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <Text style={styles.lineTitle}>{item.title}</Text>
                <SeverityBadge
                  level={item.severity}
                  labels={{ high: "Alta", medium: "Média" }}
                />
              </View>
              <Text style={styles.lineSub}>{item.description}</Text>
            </View>
            <Action
              title={item.ctaLabel}
              onPress={() => onActionPress(item)}
              secondary
            />
          </View>
        ))
      )}
    </View>
  );
}

function formatAutomationStatus(status: CrmAutomationAction["status"]) {
  if (status === "OPEN") return "Aberta";
  if (status === "IN_PROGRESS") return "Em andamento";
  if (status === "SNOOZED") return "Adiada";
  if (status === "DONE") return "Concluída";
  return "Dispensada";
}

function formatAutomationDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
