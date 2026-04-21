import AsyncStorage from "@react-native-async-storage/async-storage";
import { PacientesListQuickAction, RootStackParamList } from "../types";
import {
  navigateByQuickAction,
  openQuickActionSelection,
  QuickActionSource,
} from "../services/quickActions";
import { trackEvent } from "../services/analytics";

type AppNavigator = {
  navigate<RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName]
      ?
          | [screen: RouteName]
          | [screen: RouteName, params: RootStackParamList[RouteName]]
      : [screen: RouteName, params: RootStackParamList[RouteName]]
  ): void;
};

const quickActionShortcutKey = (action: PacientesListQuickAction) =>
  `quick-action:last-patient:v1:${action}`;

export function useQuickActions(navigation: AppNavigator) {
  const openSelection = (action: PacientesListQuickAction, source: QuickActionSource) => {
    trackEvent("quick_action_mode_opened", { action, source }).catch(
      () => undefined,
    );
    openQuickActionSelection(navigation, action);
  };

  const selectPatient = async (
    action: PacientesListQuickAction,
    pacienteId: string,
    source: "card" | "cta",
    onBeforeNavigate?: () => void,
  ) => {
    await trackEvent("quick_action_patient_selected", {
      action,
      pacienteId,
      source,
    }).catch(() => undefined);

    await AsyncStorage.setItem(quickActionShortcutKey(action), pacienteId).catch(
      () => undefined,
    );

    onBeforeNavigate?.();
    navigateByQuickAction(navigation, action, pacienteId);
  };

  const getShortcutPacienteId = async (action: PacientesListQuickAction) =>
    AsyncStorage.getItem(quickActionShortcutKey(action));

  return {
    openSelection,
    selectPatient,
    getShortcutPacienteId,
    quickActionShortcutKey,
  };
}
