import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const read = (relativePath) =>
  readFileSync(join(root, relativePath), "utf8");

const checks = [];

const addCheck = (label, file, patterns) => {
  checks.push({ label, file, patterns });
};

addCheck("biometria usa autenticacao local nativa", "src/services/biometricAuth.ts", [
  "expo-local-authentication",
  "hasHardwareAsync",
  "isEnrolledAsync",
  "supportedAuthenticationTypesAsync",
  "authenticateAsync",
  "disableDeviceFallback: false",
]);

addCheck("preferencia biometrica e vinculada ao usuario", "src/services/biometricAuth.ts", [
  "userId",
  "saveBiometricLoginPreference",
  "clearBiometricLoginPreference",
  "loadBiometricLoginPreference",
]);

addCheck("tokens ficam em SecureStore no mobile nativo", "src/services/authSessionStorage.ts", [
  "expo-secure-store",
  "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
  "refreshTokenKey",
  "persistAuthSession",
  "readStoredAuthSession",
  "clearStoredAuthSession",
]);

addCheck("api renova access token com refresh token", "src/services/api.ts", [
  '"/auth/refresh"',
  "readStoredRefreshToken",
  "persistAuthTokens",
  "setOnTokenRefreshed",
  "setOnSessionExpired",
  "_retry",
]);

addCheck("logout limpa sessao e biometria local", "src/stores/authStore.ts", [
  "logout: async",
  "clearStoredAuthSession",
  "clearBiometricLoginPreference",
  "delete api.defaults.headers.common.Authorization",
  "refreshToken: null",
  "isAuthenticated: false",
]);

addCheck("login biometrico exige sessao salva e prompt local", "src/stores/authStore.ts", [
  "loginWithBiometrics",
  "readStoredAuthSession",
  "loadBiometricLoginPreference",
  "authenticateWithBiometrics",
]);

const failures = [];

for (const check of checks) {
  const content = read(check.file);
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) {
      failures.push(`${check.label}: ${check.file} nao contem "${pattern}"`);
    }
  }
}

if (failures.length > 0) {
  console.error("Critical mobile flow check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Critical mobile flow check passed for ${checks.length} area(s).`);
