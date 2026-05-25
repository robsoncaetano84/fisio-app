export type NotificationType =
  | "reply"
  | "mention"
  | "useful-answer"
  | "moderation"
  | "resource"
  | "system";

export type LocalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export const NOTIFICATIONS_STORAGE_KEY = "synap-community:notifications";
export const NOTIFICATIONS_UPDATED_EVENT =
  "synap-community:notifications-updated";

export const notificationTypeLabel: Record<NotificationType, string> = {
  reply: "Resposta",
  mention: "Mencao",
  "useful-answer": "Resposta util",
  moderation: "Moderacao",
  resource: "Recurso",
  system: "Sistema",
};

const demoNotifications: LocalNotification[] = [
  {
    id: "notification-reply-demo",
    type: "reply",
    title: "Nova resposta em discussao clinica",
    body: "Uma resposta adicionou criterios de reavaliacao e referencia bibliografica.",
    href: "/discussoes/como-estruturar-discussao-clinica-sem-expor-dados",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notification-useful-demo",
    type: "useful-answer",
    title: "Resposta marcada como mais util",
    body: "O reconhecimento tecnico prioriza clareza, cautela e aplicabilidade clinica.",
    href: "/discussoes/criterios-para-marcar-resposta-mais-util",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notification-resource-demo",
    type: "resource",
    title: "Referencia recomendada para leitura",
    body: "Estrutura PICO ajuda a transformar duvidas amplas em perguntas clinicas objetivas.",
    href: "/referencias/estrutura-pico-perguntas-clinicas",
    read: true,
    createdAt: new Date().toISOString(),
  },
];

export function readLocalNotifications(): LocalNotification[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!raw) {
    writeLocalNotifications(demoNotifications);
    return demoNotifications;
  }

  try {
    const parsed = JSON.parse(raw) as LocalNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalNotifications(notifications: LocalNotification[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    NOTIFICATIONS_STORAGE_KEY,
    JSON.stringify(notifications.slice(0, 100)),
  );
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export function pushLocalNotification(notification: LocalNotification) {
  writeLocalNotifications([notification, ...readLocalNotifications()]);
}

export function markNotificationRead(notificationId: string) {
  writeLocalNotifications(
    readLocalNotifications().map((notification) =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification,
    ),
  );
}

export function markAllNotificationsRead() {
  writeLocalNotifications(
    readLocalNotifications().map((notification) => ({
      ...notification,
      read: true,
    })),
  );
}
