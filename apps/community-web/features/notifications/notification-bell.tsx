"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
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
      // Local fallback keeps the notification bell usable offline.
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
      // Local fallback keeps the notification bell usable offline.
    }
  };

  return (
    <div className="relative">
      <button
        aria-label="Notificacoes"
        className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-synap text-synap-muted hover:bg-synap-primary/10 hover:text-synap-primary"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-synap-accent px-1 text-[10px] font-extrabold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-synap border border-synap-border bg-white p-4 shadow-synap">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-synap-text">
                Notificacoes
              </h2>
              <p className="text-xs font-semibold text-synap-muted">
                Atualizacoes tecnicas e de moderacao.
              </p>
            </div>
            <button
              aria-label="Fechar notificacoes"
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-synap text-synap-muted hover:bg-synap-background hover:text-synap-text"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.slice(0, 5).map((notification) => (
              <Link
                className={`block rounded-synap border p-3 transition hover:border-synap-primary/40 ${
                  notification.read
                    ? "border-synap-border bg-white"
                    : "border-synap-primary/20 bg-synap-primary/10"
                }`}
                href={notification.href}
                key={notification.id}
                onClick={() => {
                  void markRead(notification.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={notification.read ? "neutral" : "primary"}>
                    {notificationTypeLabel[notification.type]}
                  </Badge>
                  {!notification.read ? (
                    <span className="h-2 w-2 rounded-full bg-synap-primary" />
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-extrabold leading-5 text-synap-text">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-synap-muted">
                  {notification.body}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-synap-border pt-3">
            <button
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
              onClick={markAllRead}
              type="button"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar lidas
            </button>
            <Link
              className="focus-ring inline-flex h-9 items-center rounded-synap bg-synap-primary px-3 text-xs font-bold text-white shadow-subtle transition hover:bg-synap-primaryDark"
              href="/notificacoes"
              onClick={() => setIsOpen(false)}
            >
              Ver todas
            </Link>
          </div>
        </div>
      ) : null}
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
