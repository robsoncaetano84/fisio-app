import React from "react";
import { Text, TextInput, View } from "react-native";
import { useLanguage } from "../../i18n/LanguageProvider";
import type { CrmLead, CrmTask } from "../../services/crm";
import {
  Action,
  BarChart,
  Chip,
  MetricMini,
  SmallBtn,
} from "./AdminCrmScreen.components";
import { styles } from "./AdminCrmScreen.styles";
import type { TaskBucket } from "./AdminCrmScreen.types";
import {
  dt,
  toLocal,
  type ChartDataItem,
  type TaskBuckets,
} from "./AdminCrmScreen.utils";

type TaskForm = {
  id: string;
  titulo: string;
  dueAt: string;
  leadId: string;
};

type TasksTabProps = {
  form: TaskForm;
  tasks: CrmTask[];
  filteredTasks: CrmTask[];
  taskBuckets: TaskBuckets;
  bucketFilter: TaskBucket;
  taskStatusChartData: ChartDataItem[];
  taskLeadMap: Map<string, CrmLead>;
  onTitleChange: (value: string) => void;
  onLeadIdChange: (value: string) => void;
  onDueAtChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onBucketFilterChange: (value: TaskBucket) => void;
  onEdit: (form: TaskForm) => void;
  onToggleStatus: (task: CrmTask) => void;
  onDelete: (taskId: string) => void;
};

export function TasksTab({
  form,
  tasks,
  filteredTasks,
  taskBuckets,
  bucketFilter,
  taskStatusChartData,
  taskLeadMap,
  onTitleChange,
  onLeadIdChange,
  onDueAtChange,
  onSave,
  onReset,
  onExport,
  onBucketFilterChange,
  onEdit,
  onToggleStatus,
  onDelete,
}: TasksTabProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.split}>
      <View style={styles.pane}>
        <Text style={styles.section}>
          {form.id ? t("crm.forms.editTaskTitle") : t("crm.forms.createTaskTitle")}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={t("crm.placeholders.title")}
          value={form.titulo}
          onChangeText={onTitleChange}
        />
        <TextInput
          style={styles.input}
          placeholder={t("crm.placeholders.leadIdOptional")}
          value={form.leadId}
          onChangeText={onLeadIdChange}
        />
        <TextInput
          style={styles.input}
          placeholder={t("crm.placeholders.dueAtIso")}
          value={form.dueAt}
          onChangeText={onDueAtChange}
        />
        <View style={styles.wrapRow}>
          <Action
            title={form.id ? t("crm.forms.saveTask") : t("crm.forms.createTask")}
            onPress={onSave}
          />
          <Action title={t("crm.actions.clear")} secondary onPress={onReset} />
        </View>
      </View>
      <View style={styles.pane}>
        <View style={styles.topRow}>
          <Text style={styles.section}>{t("crm.sections.taskList")}</Text>
          <Action title={t("crm.actions.exportCsv")} secondary onPress={onExport} />
        </View>
        <View style={styles.wrapRow}>
          <MetricMini label={t("crm.tasks.all")} value={String(tasks.length)} />
          <MetricMini
            label={t("crm.tasks.late")}
            value={String(taskBuckets.atrasadas.length)}
          />
          <MetricMini
            label={t("crm.tasks.today")}
            value={String(taskBuckets.hoje.length)}
          />
          <MetricMini
            label={t("crm.tasks.next7d")}
            value={String(taskBuckets.proximas.length)}
          />
          <MetricMini
            label={t("crm.tasks.completed")}
            value={String(taskBuckets.concluidas.length)}
          />
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={styles.chartTitle}>{t("crm.tasks.chartTitle")}</Text>
          <BarChart items={taskStatusChartData} />
        </View>
        <View style={styles.wrapRow}>
          <Chip
            label={t("crm.tasks.all")}
            active={bucketFilter === "TODAS"}
            onPress={() => onBucketFilterChange("TODAS")}
          />
          <Chip
            label={t("crm.tasks.late")}
            active={bucketFilter === "ATRASADAS"}
            onPress={() => onBucketFilterChange("ATRASADAS")}
          />
          <Chip
            label={t("crm.tasks.today")}
            active={bucketFilter === "HOJE"}
            onPress={() => onBucketFilterChange("HOJE")}
          />
          <Chip
            label={t("crm.tasks.next7d")}
            active={bucketFilter === "PROXIMAS"}
            onPress={() => onBucketFilterChange("PROXIMAS")}
          />
          <Chip
            label={t("crm.tasks.completed")}
            active={bucketFilter === "CONCLUIDAS"}
            onPress={() => onBucketFilterChange("CONCLUIDAS")}
          />
        </View>
        {filteredTasks.map((task) => (
          <View key={task.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle}>{task.titulo}</Text>
              <Text style={styles.lineSub}>
                {task.status} {"\u2022"}{" "}
                {task.dueAt ? dt(task.dueAt) : t("crm.labels.noDueDate")}{" "}
                {"\u2022"}{" "}
                {task.leadId
                  ? taskLeadMap.get(task.leadId)?.nome ||
                    t("crm.labels.leadRemoved")
                  : t("crm.labels.noLead")}
              </Text>
            </View>
            <SmallBtn
              title={t("crm.actions.edit")}
              onPress={() =>
                onEdit({
                  id: task.id,
                  titulo: task.titulo,
                  dueAt: task.dueAt ? toLocal(task.dueAt) : "",
                  leadId: task.leadId || "",
                })
              }
            />
            <SmallBtn
              title={
                task.status === "CONCLUIDA"
                  ? t("crm.actions.reopenTask")
                  : t("crm.actions.finishTask")
              }
              onPress={() => onToggleStatus(task)}
            />
            <SmallBtn
              danger
              title={t("crm.actions.delete")}
              onPress={() => onDelete(task.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
