// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// PUSH NOTIFICATIONS
// ==========================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserRole } from "../types";

const REMINDER_KEY_PREFIX = "notifications:daily-reminder";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModuleCache: NotificationsModule | null | undefined;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (notificationsModuleCache !== undefined) {
    return notificationsModuleCache;
  }

  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationsModuleCache = Notifications;
    return Notifications;
  } catch {
    notificationsModuleCache = null;
    return null;
  }
}

export async function registerPushTokenIfNeeded(
  userId: string,
  role: UserRole,
): Promise<void> {
  if (role !== UserRole.PACIENTE) {
    return;
  }
  await ensurePatientDailyReminder(userId);
}

export async function ensurePatientDailyReminder(userId: string): Promise<boolean> {
  const storageKey = `${REMINDER_KEY_PREFIX}:${userId}`;

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return false;
    }

    const alreadyScheduled = await AsyncStorage.getItem(storageKey);
    if (alreadyScheduled === "1") {
      return false;
    }

    const settings = await Notifications.getPermissionsAsync();
    const finalStatus =
      settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
        ? "granted"
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== "granted") {
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora do seu check-in",
        body: "Registre sua atividade de hoje para manter a evolucao em dia.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return false;
  }
}
