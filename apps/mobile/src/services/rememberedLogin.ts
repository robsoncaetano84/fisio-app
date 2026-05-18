import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "../constants/theme";

type RememberedLoginScope = "app" | "crm";

type RememberedLoginKeys = {
  enabledKey: string;
  identifierKey: string;
};

type RememberedLoginState = {
  remember: boolean;
  identifier: string;
};

function getRememberedLoginKeys(
  scope: RememberedLoginScope,
): RememberedLoginKeys {
  if (scope === "crm") {
    return {
      enabledKey: APP_CONFIG.storage.crmRememberLoginKey,
      identifierKey: APP_CONFIG.storage.crmRememberedEmailKey,
    };
  }

  return {
    enabledKey: APP_CONFIG.storage.rememberLoginKey,
    identifierKey: APP_CONFIG.storage.rememberedLoginIdentifierKey,
  };
}

export async function loadRememberedLogin(
  scope: RememberedLoginScope,
): Promise<RememberedLoginState> {
  const keys = getRememberedLoginKeys(scope);
  const [enabled, identifier] = await Promise.all([
    AsyncStorage.getItem(keys.enabledKey),
    AsyncStorage.getItem(keys.identifierKey),
  ]);

  const remember = enabled === "1";
  return {
    remember,
    identifier: remember ? identifier || "" : "",
  };
}

export async function saveRememberedLogin(
  scope: RememberedLoginScope,
  identifier: string,
  remember: boolean,
): Promise<void> {
  if (!remember) {
    await clearRememberedLogin(scope);
    return;
  }

  const keys = getRememberedLoginKeys(scope);
  await Promise.all([
    AsyncStorage.setItem(keys.enabledKey, "1"),
    AsyncStorage.setItem(keys.identifierKey, identifier),
  ]);
}

export async function clearRememberedLogin(
  scope: RememberedLoginScope,
): Promise<void> {
  const keys = getRememberedLoginKeys(scope);
  await Promise.all([
    AsyncStorage.removeItem(keys.enabledKey),
    AsyncStorage.removeItem(keys.identifierKey),
  ]);
}
