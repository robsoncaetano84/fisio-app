"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type LocalNotification,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type NotificationType,
  notificationTypeLabel,
  readLocalNotifications,
} from "@/features/notifications/local-notifications";
import {
  getCommunityNotifications,
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
  type CommunityNotificationItem,
} from "@/lib/community-write-api";

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);

  useEffect(() => {
    let mounted = true;
    const syncNotifications = async () => {
      try {
        const remoteNotifications = await getCommunityNotifications();
        if (!mounted) return;
        setNotifications(remoteNotifications.map(mapRemoteNotification));
      } catch {
        if (mounted) setNotifications(readLocalNotifications());
      }
    };
    syncNotifications();

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
    window.addEventListener("storage", syncNotifications);

    return () => {
      mounted = false;
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        syncNotifications,
      );
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const markAllRead = async () => {
    markAllNotificationsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    try {
      await markAllCommunityNotificationsRead();
    } catch {
      // Local fallback keeps the notification center usable offline.
    }
  };

  const markRead = async (notificationId: string) => {
    markNotificationRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    try {
      await markCommunityNotificationRead(notificationId);
    } catch {
      // Local fallback keeps the notification center usable offline.
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Counter label="Nao lidas" value={unreadCount} />
        <Counter label="Total" value={notifications.length} />
        <Counter label="Lidas" value={notifications.length - unreadCount} />
      </div>

      <div className="flex justify-end">
        <button
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
          onClick={markAllRead}
          type="button"
        >
          <CheckCheck className="h-4 w-4" />
          Marcar todas como lidas
        </button>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              className={`rounded-synap border p-5 shadow-subtle ${
                notification.read
                  ? "border-synap-border bg-white"
                  : "border-synap-primary/25 bg-synap-primary/10"
              }`}
              key={notification.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={notification.read ? "neutral" : "primary"}>
                      {notificationTypeLabel[notification.type]}
                    </Badge>
                    {!notification.read ? (
                      <span className="text-xs font-extrabold text-synap-primary">
                        Nova
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-base font-extrabold leading-7 text-synap-text">
                    {notification.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-synap-muted">
                    {notification.body}
                  </p>
                </div>
                <Link
                  className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
                  href={notification.href}
                  onClick={() => void markRead(notification.id)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir
                </Link>
              </div>

              {!notification.read ? (
                <div className="mt-4 flex justify-end border-t border-synap-border pt-4">
                  <button
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap bg-synap-primary px-3 text-xs font-bold text-white shadow-subtle transition hover:bg-synap-primaryDark"
                    onClick={() => void markRead(notification.id)}
                    type="button"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar como lida
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-synap border border-dashed border-synap-border bg-white p-6">
          <div className="flex items-center gap-2 text-synap-primary">
            <Bell className="h-5 w-5" />
            <h2 className="text-base font-extrabold text-synap-text">
              Nenhuma notificacao
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-synap-muted">
            Respostas, mencoes, moderacao e recursos recomendados aparecerao
            aqui quando houver atividade na sua conta.
          </p>
        </div>
      )}
    </div>
  );
}

function mapRemoteNotification(
  notification: CommunityNotificationItem,
): LocalNotification {
  return {
    id: notification.id,
    type: mapNotificationType(notification.type),
    title: notification.title,
    body: notification.body || "",
    href: notification.href || "/notificacoes",
    read: Boolean(notification.readAt),
    createdAt: notification.createdAt,
  };
}

function mapNotificationType(type: string): NotificationType {
  const normalized = type.toUpperCase();
  if (normalized === "REPLY") return "reply";
  if (normalized === "MENTION") return "mention";
  if (normalized === "USEFUL_REPLY") return "useful-answer";
  if (normalized === "MODERATION") return "moderation";
  if (normalized === "RELEVANT_DISCUSSION") return "resource";
  return "system";
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-4">
      <p className="text-2xl font-extrabold text-synap-text">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-normal text-synap-muted">
        {label}
      </p>
    </div>
  );
}
