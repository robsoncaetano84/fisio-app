import type { CrmTask } from "../../services/crm";
import type { TaskBucket } from "./AdminCrmScreen.types";
import type { ChartDataItem, TaskBuckets } from "./AdminCrmScreen.models";

export const buildTaskBuckets = (tasks: CrmTask[]): TaskBuckets => {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(startToday.getTime() + dayMs);
  const endNext7Days = new Date(endToday.getTime() + 7 * dayMs);

  const isPendingWithDueDate = (task: CrmTask) =>
    task.status !== "CONCLUIDA" && Boolean(task.dueAt);
  const dueTime = (task: CrmTask) => new Date(task.dueAt || 0).getTime();

  const atrasadas = tasks.filter((task) => {
    if (!isPendingWithDueDate(task)) return false;
    const dueMs = dueTime(task);
    return !Number.isNaN(dueMs) && dueMs < startToday.getTime();
  });
  const hoje = tasks.filter((task) => {
    if (!isPendingWithDueDate(task)) return false;
    const dueMs = dueTime(task);
    return (
      !Number.isNaN(dueMs) &&
      dueMs >= startToday.getTime() &&
      dueMs < endToday.getTime()
    );
  });
  const proximas = tasks.filter((task) => {
    if (!isPendingWithDueDate(task)) return false;
    const dueMs = dueTime(task);
    return (
      !Number.isNaN(dueMs) &&
      dueMs >= endToday.getTime() &&
      dueMs <= endNext7Days.getTime()
    );
  });
  const concluidas = tasks.filter((task) => task.status === "CONCLUIDA");

  return { atrasadas, hoje, proximas, concluidas };
};

export const filterTasksByBucket = (
  tasks: CrmTask[],
  buckets: TaskBuckets,
  bucket: TaskBucket,
) => {
  if (bucket === "ATRASADAS") return buckets.atrasadas;
  if (bucket === "HOJE") return buckets.hoje;
  if (bucket === "PROXIMAS") return buckets.proximas;
  if (bucket === "CONCLUIDAS") return buckets.concluidas;
  return tasks;
};

export const buildTaskStatusChartData = (
  buckets: TaskBuckets,
): ChartDataItem[] => [
  {
    label: "Atrasadas",
    value: buckets.atrasadas.length,
    color: "#EF4444",
  },
  { label: "Hoje", value: buckets.hoje.length, color: "#F59E0B" },
  {
    label: "Próximas 7d",
    value: buckets.proximas.length,
    color: "#0EA5E9",
  },
  {
    label: "Concluídas",
    value: buckets.concluidas.length,
    color: "#22C55E",
  },
];
