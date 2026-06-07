import React, { useMemo, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import type {
  CrmAutomationAction,
  CrmAutomationMetricsResponse,
  CrmCommandCenterActionType,
  CrmCommandCenterItem,
  CrmCommandCenterSummary,
} from "../../services/crm";
import {
  Action,
  Chip,
  Metric,
  SeverityBadge,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";

const ACTION_FILTERS: Array<{
  key: CrmCommandCenterActionType | "TODAS";
  label: string;
}> = [
  { key: "TODAS", label: "Todas" },
  { key: "PATIENT_NO_EVOLUTION", label: "Sem evolução" },
  { key: "PATIENT_NO_CHECKIN", label: "Sem check-in" },
  { key: "LEAD_STALE", label: "Lead parado" },
  { key: "PENDING_INVITE", label: "Convite pendente" },
];

type CommandCenterPanelProps = {
  summary: CrmCommandCenterSummary | null;
  onActionPress: (item: CrmCommandCenterItem) => void;
  automationActions: CrmAutomationAction[];
  automationMetrics: CrmAutomationMetricsResponse | null;
  automationTypeFilter: CrmCommandCenterActionType | "TODAS";
  onAutomationTypeFilterChange: (
    value: CrmCommandCenterActionType | "TODAS",
  ) => void;
  onAutomationPress: (item: CrmAutomationAction) => void;
  onAutomationStatusChange: (
    item: CrmAutomationAction,
    status: "DONE" | "DISMISSED" | "SNOOZED",
  ) => void;
  onAutomationSnooze: (item: CrmAutomationAction, hours: number) => void;
  onAutomationAssignToMe: (item: CrmAutomationAction) => void;
  currentUserId: string | null;
  professionals: Array<{ id: string; nome: string }>;
};

export function CommandCenterPanel({
  summary,
  onActionPress,
  automationActions,
  automationMetrics,
  automationTypeFilter,
  onAutomationTypeFilterChange,
  onAutomationPress,
  onAutomationStatusChange,
  onAutomationSnooze,
  onAutomationAssignToMe,
  currentUserId,
  professionals,
}: CommandCenterPanelProps) {
  const [selectedAutomation, setSelectedAutomation] =
    useState<CrmAutomationAction | null>(null);
  const kpis = summary?.kpis;
  const actions = summary?.nextActions || [];
  const persistedActions = automationActions || [];
  const visiblePersistedActions = persistedActions.slice(0, 12);
  const hasPersistedActions = persistedActions.length > 0;
  const professionalById = useMemo(
    () => new Map(professionals.map((item) => [item.id, item.nome])),
    [professionals],
  );
  const selectedTypeMetrics = useMemo(() => {
    if (!automationMetrics || automationTypeFilter === "TODAS") return null;
    return automationMetrics.byType.find(
      (item) => item.type === automationTypeFilter,
    );
  }, [automationMetrics, automationTypeFilter]);

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

      <View style={[styles.wrapRow, { marginTop: 10 }]}>
        {ACTION_FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            active={automationTypeFilter === filter.key}
            onPress={() => onAutomationTypeFilterChange(filter.key)}
          />
        ))}
      </View>

      {automationMetrics ? (
        <View style={styles.kpiGrid}>
          <Metric
            label="Ações vencidas"
            value={String(automationMetrics.totals.overdueOpenActions)}
          />
          <Metric
            label="Tempo médio resolução"
            value={`${automationMetrics.totals.avgResolutionHours}h`}
          />
          <Metric
            label="Dispensadas"
            value={String(automationMetrics.totals.dismissedActions)}
          />
          <Metric
            label={
              selectedTypeMetrics
                ? `Resolução ${formatAutomationType(selectedTypeMetrics.type)}`
                : "Resolvidas"
            }
            value={
              selectedTypeMetrics
                ? `${selectedTypeMetrics.resolutionRate}%`
                : String(automationMetrics.totals.resolvedActions)
            }
          />
        </View>
      ) : null}

      {automationMetrics?.bottlenecks.byProfessional[0] ? (
        <Text style={styles.lineSub}>
          Gargalo profissional:{" "}
          {automationMetrics.bottlenecks.byProfessional[0].nome} ·{" "}
          {automationMetrics.bottlenecks.byProfessional[0].open} aberta(s),{" "}
          {automationMetrics.bottlenecks.byProfessional[0].overdue} vencida(s)
        </Text>
      ) : null}
      {automationMetrics?.bottlenecks.byPatient[0] ? (
        <Text style={styles.lineSub}>
          Gargalo paciente: {automationMetrics.bottlenecks.byPatient[0].nome} ·{" "}
          {automationMetrics.bottlenecks.byPatient[0].open} aberta(s),{" "}
          {automationMetrics.bottlenecks.byPatient[0].overdue} vencida(s)
        </Text>
      ) : null}

      {hasPersistedActions ? (
        visiblePersistedActions.map((item) => (
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
                Status: {formatAutomationStatus(item.status)} · SLA:{" "}
                {formatAutomationDate(item.slaDueAt)} · Responsável:{" "}
                {resolveResponsibleLabel(item, professionalById, currentUserId)}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <Action
                title={item.ctaLabel}
                onPress={() => onAutomationPress(item)}
                secondary
              />
              <Action
                title="Detalhes"
                onPress={() => setSelectedAutomation(item)}
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

      {persistedActions.length > visiblePersistedActions.length ? (
        <Text style={styles.lineSub}>
          Exibindo {visiblePersistedActions.length} de {persistedActions.length}{" "}
          ações carregadas neste filtro.
        </Text>
      ) : null}

      <AutomationDetailModal
        item={selectedAutomation}
        responsibleLabel={
          selectedAutomation
            ? resolveResponsibleLabel(
                selectedAutomation,
                professionalById,
                currentUserId,
              )
            : ""
        }
        onClose={() => setSelectedAutomation(null)}
        onOpen={() => {
          if (!selectedAutomation) return;
          onAutomationPress(selectedAutomation);
          setSelectedAutomation(null);
        }}
        onAssignToMe={() => {
          if (!selectedAutomation) return;
          onAutomationAssignToMe(selectedAutomation);
        }}
        onSnooze={(hours) => {
          if (!selectedAutomation) return;
          onAutomationSnooze(selectedAutomation, hours);
          setSelectedAutomation(null);
        }}
        onDone={() => {
          if (!selectedAutomation) return;
          onAutomationStatusChange(selectedAutomation, "DONE");
          setSelectedAutomation(null);
        }}
        onDismiss={() => {
          if (!selectedAutomation) return;
          onAutomationStatusChange(selectedAutomation, "DISMISSED");
          setSelectedAutomation(null);
        }}
      />
    </View>
  );
}

function AutomationDetailModal({
  item,
  responsibleLabel,
  onClose,
  onOpen,
  onAssignToMe,
  onSnooze,
  onDone,
  onDismiss,
}: {
  item: CrmAutomationAction | null;
  responsibleLabel: string;
  onClose: () => void;
  onOpen: () => void;
  onAssignToMe: () => void;
  onSnooze: (hours: number) => void;
  onDone: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal
      visible={Boolean(item)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {item ? (
            <ScrollView>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.section}>{item.title}</Text>
                  <Text style={styles.lineSub}>{item.description}</Text>
                </View>
                <SeverityBadge
                  level={item.severity}
                  labels={{ high: "Alta", medium: "Média" }}
                />
              </View>

              <View style={styles.kpiGrid}>
                <Metric label="Tipo" value={formatAutomationType(item.type)} />
                <Metric
                  label="Status"
                  value={formatAutomationStatus(item.status)}
                />
                <Metric
                  label="SLA"
                  value={formatAutomationDate(item.slaDueAt)}
                />
                <Metric label="Responsável" value={responsibleLabel} />
              </View>

              <Text style={styles.lineTitle}>Histórico completo</Text>
              {(item.history || []).length === 0 ? (
                <Text style={styles.lineSub}>Sem histórico registrado.</Text>
              ) : (
                item.history.map((entry, index) => (
                  <View key={`${entry.at}-${index}`} style={styles.line}>
                    <Text style={styles.lineTitle}>
                      {formatHistoryType(entry.type)} ·{" "}
                      {formatAutomationDateTime(entry.at)}
                    </Text>
                    <Text style={styles.lineSub}>
                      {entry.fromStatus || "-"} → {entry.toStatus || "-"}
                    </Text>
                    {entry.note ? (
                      <Text style={styles.lineSub}>Nota: {entry.note}</Text>
                    ) : null}
                  </View>
                ))
              )}

              <View style={styles.modalActionsGrid}>
                <Action title={item.ctaLabel} onPress={onOpen} secondary />
                <Action title="Assumir" onPress={onAssignToMe} secondary />
                <Action
                  title="Adiar 24h"
                  onPress={() => onSnooze(24)}
                  secondary
                />
                <Action
                  title="Adiar 72h"
                  onPress={() => onSnooze(72)}
                  secondary
                />
                <Action title="Concluir" onPress={onDone} secondary />
                <Action title="Dispensar" onPress={onDismiss} secondary />
                <Action title="Fechar" onPress={onClose} secondary />
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function resolveResponsibleLabel(
  item: CrmAutomationAction,
  professionalById: Map<string, string>,
  currentUserId: string | null,
) {
  if (item.responsavelUsuarioId === currentUserId) return "Você";
  if (item.responsavelUsuarioId) {
    return professionalById.get(item.responsavelUsuarioId) || "Responsável CRM";
  }
  const metadataName =
    typeof item.metadata?.profissionalNome === "string"
      ? item.metadata.profissionalNome
      : null;
  return metadataName || "Sem responsável";
}

function formatAutomationStatus(status: CrmAutomationAction["status"]) {
  if (status === "OPEN") return "Aberta";
  if (status === "IN_PROGRESS") return "Em andamento";
  if (status === "SNOOZED") return "Adiada";
  if (status === "DONE") return "Concluída";
  return "Dispensada";
}

function formatAutomationType(type: CrmCommandCenterActionType) {
  if (type === "PATIENT_NO_EVOLUTION") return "Sem evolução";
  if (type === "PATIENT_NO_CHECKIN") return "Sem check-in";
  if (type === "LEAD_STALE") return "Lead parado";
  if (type === "PENDING_INVITE") return "Convite pendente";
  if (type === "TASK_OVERDUE") return "Tarefa vencida";
  if (type === "PENDING_ANAMNESIS") return "Anamnese";
  return "Baixa ativação";
}

function formatHistoryType(type: string) {
  if (type === "CREATED") return "Criada";
  if (type === "SEEN") return "Atualizada";
  if (type === "STATUS_CHANGED") return "Status alterado";
  if (type === "SLA_CHANGED") return "SLA alterado";
  if (type === "ASSIGNED") return "Responsável alterado";
  return "Nota";
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

function formatAutomationDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
