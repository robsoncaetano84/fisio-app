import Constants from "expo-constants";
import { Platform } from "react-native";

const expoVersion = String(Constants.expoConfig?.version || "").trim();
const envVersion = String(process.env.EXPO_PUBLIC_APP_VERSION || "").trim();

export const APP_VERSION = expoVersion || envVersion || "0.0.0";

const iosBuild = String(Constants.expoConfig?.ios?.buildNumber || "").trim();
const androidBuildRaw = Constants.expoConfig?.android?.versionCode;
const androidBuild =
  typeof androidBuildRaw === "number" ? String(androidBuildRaw) : "";

export const APP_BUILD_NUMBER =
  Platform.OS === "ios"
    ? iosBuild || null
    : Platform.OS === "android"
      ? androidBuild || null
      : null;

export const APP_VERSION_LABEL = APP_BUILD_NUMBER
  ? `v${APP_VERSION} (${APP_BUILD_NUMBER})`
  : `v${APP_VERSION}`;
