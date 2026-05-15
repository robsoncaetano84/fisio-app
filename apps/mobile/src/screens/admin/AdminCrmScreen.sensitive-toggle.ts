import { useCallback, type Dispatch, type SetStateAction } from "react";
import { Alert, Platform } from "react-native";

type SensitiveToggleToast = {
  type: "error";
  message: string;
};

type SensitiveToggleParams = {
  includeSensitiveData: boolean;
  setIncludeSensitiveData: Dispatch<SetStateAction<boolean>>;
  setSensitiveReason: Dispatch<SetStateAction<string>>;
  showToast: (toast: SensitiveToggleToast) => void;
  t: (key: string) => string;
};

export function useSensitiveDataToggle({
  includeSensitiveData,
  setIncludeSensitiveData,
  setSensitiveReason,
  showToast,
  t,
}: SensitiveToggleParams) {
  return useCallback(() => {
    if (includeSensitiveData) {
      setIncludeSensitiveData(false);
      setSensitiveReason("");
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const typedReason = window.prompt(
        t("crm.messages.sensitiveDataPrompt"),
        "",
      );
      if (!typedReason) return;
      const normalizedReason = typedReason.trim();
      if (normalizedReason.length < 8) {
        showToast({
          type: "error",
          message: t("crm.messages.sensitiveReasonMinLength"),
        });
        return;
      }
      setSensitiveReason(normalizedReason);
      setIncludeSensitiveData(true);
      return;
    }
    Alert.alert(
      t("crm.messages.showSensitiveDataTitle"),
      t("crm.messages.showSensitiveDataDescription"),
      [
        { text: t("crm.actions.cancel"), style: "cancel" },
        {
          text: t("crm.actions.show"),
          onPress: () => setIncludeSensitiveData(true),
        },
      ],
    );
  }, [
    includeSensitiveData,
    setIncludeSensitiveData,
    setSensitiveReason,
    showToast,
    t,
  ]);
}
