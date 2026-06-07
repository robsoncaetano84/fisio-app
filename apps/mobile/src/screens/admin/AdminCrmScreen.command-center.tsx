import React from "react";
import { Text, View } from "react-native";
import type {
  CrmCommandCenterItem,
  CrmCommandCenterSummary,
} from "../../services/crm";
import { Action, Metric, SeverityBadge } from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";

type CommandCenterPanelProps = {
  summary: CrmCommandCenterSummary | null;
  onActionPress: (item: CrmCommandCenterItem) => void;
};

export function CommandCenterPanel({
  summary,
  onActionPress,
}: CommandCenterPanelProps) {
  const kpis = summary?.kpis;
  const actions = summary?.nextActions || [];

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
        <Metric
          label="Leads parados"
          value={String(kpis?.staleLeads || 0)}
        />
      </View>

      {actions.length === 0 ? (
        <View style={styles.line}>
          <Text style={styles.lineTitle}>
            Nenhuma ação crítica no momento
          </Text>
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
