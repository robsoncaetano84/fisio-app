import { RootStackParamList, PacientesListQuickAction } from "../types";

type AppNavigator = {
  navigate<RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName]
      ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
      : [screen: RouteName, params: RootStackParamList[RouteName]]
  ): void;
};

export type QuickActionSource = "home" | "home_long_press";

export function openQuickActionSelection(
  navigation: AppNavigator,
  action: PacientesListQuickAction,
) {
  navigation.navigate("PacientesList", { quickAction: action });
}

export function navigateByQuickAction(
  navigation: AppNavigator,
  action: PacientesListQuickAction,
  pacienteId: string,
) {
  if (action === "ANAMNESE") {
    navigation.navigate("AnamneseForm", { pacienteId });
    return;
  }
  if (action === "EVOLUCAO") {
    navigation.navigate("EvolucaoForm", { pacienteId });
    return;
  }
  navigation.navigate("ExameFisicoForm", { pacienteId });
}

export function quickActionIcon(action: PacientesListQuickAction) {
  if (action === "ANAMNESE") return "clipboard-outline" as const;
  if (action === "EVOLUCAO") return "trending-up-outline" as const;
  return "fitness-outline" as const;
}
