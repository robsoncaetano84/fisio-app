import React, { useEffect, useRef, useCallback } from "react";
import {
  LinkingOptions,
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../stores/authStore";
import { RootStackParamList, UserRole } from "../types";
import { COLORS } from "../constants/theme";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { PublicSettingsScreen } from "../screens/auth/PublicSettingsScreen";
import { SignupProfileSelectScreen } from "../screens/auth/SignupProfileSelectScreen";
import { ProfessionalSignupScreen } from "../screens/auth/ProfessionalSignupScreen";
import { PacienteInviteSignupScreen } from "../screens/auth/PacienteInviteSignupScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AdminCrmScreen } from "../screens/admin/AdminCrmScreen";
import { AdminMasterHomeScreen } from "../screens/admin/AdminMasterHomeScreen";
import {
  PacienteFormScreen,
  PacientesListScreen,
  PacienteDetailsScreen,
  PacienteAdesaoScreen,
  AtividadeFormScreen,
} from "../screens/pacientes";
import { AnamneseFormScreen, AnamneseListScreen } from "../screens/anamnese";
import { EvolucaoFormScreen, EvolucaoListScreen } from "../screens/evolucao";
import {
  ExameFisicoFormScreen,
  LaudoFormScreen,
  PlanoFormScreen,
} from "../screens/laudo";
import { PacienteHomeScreen } from "../screens/paciente/PacienteHomeScreen";
import { PacienteAtividadeCheckinScreen } from "../screens/paciente/PacienteAtividadeCheckinScreen";
import { useLanguage } from "../i18n/LanguageProvider";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["synap://", "/"],
  config: {
    screens: {
      Login: "login",
      PublicSettings: "configuracoes",
      SignupProfileSelect: "cadastro",
      ProfessionalSignup: "cadastro-profissional",
      PacienteInviteSignup: "cadastro-paciente",
      Home: "home",
      Settings: "settings",
      AdminHome: "admin",
      AdminCrm: "admin/crm",
      PacienteHome: "paciente",
      PacientesList: "pacientes",
      PacienteForm: "pacientes/form",
      PacienteDetails: "pacientes/:pacienteId",
      PacienteAdesao: "pacientes/:pacienteId/adesao",
      AnamneseForm: "anamnese/:pacienteId/form",
      AnamneseList: "anamnese/:pacienteId/lista",
      EvolucaoForm: "evolucao/:pacienteId/form",
      EvolucaoList: "evolucao/:pacienteId/lista",
      LaudoForm: "laudo/:pacienteId",
      ExameFisicoForm: "exame-fisico/:pacienteId",
      PlanoForm: "plano/:pacienteId",
      PacienteAtividadeCheckin: "paciente/atividade/:atividadeId/checkin",
    },
  },
};

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const AuthStack = ({ t }: { t: (key: string) => string }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen
      name="PublicSettings"
      component={PublicSettingsScreen}
      options={{ headerShown: true, title: t("nav.settings") }}
    />
    <Stack.Screen
      name="SignupProfileSelect"
      component={SignupProfileSelectScreen}
      options={{ headerShown: true, title: t("nav.signupProfileSelect") }}
    />
    <Stack.Screen
      name="ProfessionalSignup"
      component={ProfessionalSignupScreen}
      options={{ headerShown: true, title: t("nav.professionalSignup") }}
    />
    <Stack.Screen
      name="PacienteInviteSignup"
      component={PacienteInviteSignupScreen}
      options={{ headerShown: true, title: t("nav.inviteSignup") }}
    />
  </Stack.Navigator>
);

const MainStack = ({ t }: { t: (key: string) => string }) => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTitle: "",
        headerLeft: () => (
          <Image
            source={require("../../assets/synap-logo-white-tight.png")}
            style={styles.homeHeaderLogo}
            resizeMode="contain"
          />
        ),
      }}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: t("nav.settings") }}
    />
    <Stack.Screen
      name="PacientesList"
      component={PacientesListScreen}
      options={({ navigation }) => ({
        title: t("nav.patients"),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate("Home");
            }}
            style={styles.backButtonList}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        ),
      })}
    />
    <Stack.Screen
      name="PacienteForm"
      component={PacienteFormScreen}
      options={({ route }) => ({
        title: route.params?.pacienteId
          ? t("nav.editPatient")
          : t("nav.newPatient"),
      })}
    />
    <Stack.Screen
      name="PacienteDetails"
      component={PacienteDetailsScreen}
      options={({ navigation }) => ({
        title: t("nav.patientDetails"),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate("PacientesList");
            }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        ),
      })}
    />
    <Stack.Screen
      name="PacienteAdesao"
      component={PacienteAdesaoScreen}
      options={{ title: t("nav.patientAdherence") }}
    />
    <Stack.Screen
      name="AtividadeForm"
      component={AtividadeFormScreen}
      options={{ title: t("nav.prescribeActivity") }}
    />
    <Stack.Screen
      name="AnamneseForm"
      component={AnamneseFormScreen}
      options={{ title: t("nav.newAnamnesis") }}
    />
    <Stack.Screen
      name="AnamneseList"
      component={AnamneseListScreen}
      options={{ title: t("nav.anamnesisHistory") }}
    />
    <Stack.Screen
      name="EvolucaoForm"
      component={EvolucaoFormScreen}
      options={{ title: t("nav.newEvolution") }}
    />
    <Stack.Screen
      name="EvolucaoList"
      component={EvolucaoListScreen}
      options={{ title: t("nav.evolutionHistory") }}
    />
    <Stack.Screen
      name="LaudoForm"
      component={LaudoFormScreen}
      options={{ title: t("nav.report") }}
    />
    <Stack.Screen
      name="ExameFisicoForm"
      component={ExameFisicoFormScreen}
      options={{ title: t("nav.physicalExam") }}
    />
    <Stack.Screen
      name="PlanoForm"
      component={PlanoFormScreen}
      options={{ title: t("nav.plan") }}
    />
  </Stack.Navigator>
);

const PatientStack = ({ t }: { t: (key: string) => string }) => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen
      name="PacienteHome"
      component={PacienteHomeScreen}
      options={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTitle: "",
        headerLeft: () => (
          <Image
            source={require("../../assets/synap-logo-white-tight.png")}
            style={styles.homeHeaderLogo}
            resizeMode="contain"
          />
        ),
      }}
    />
    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: t("nav.settings") }}
    />
    <Stack.Screen
      name="PacienteAtividadeCheckin"
      component={PacienteAtividadeCheckinScreen}
      options={{ title: t("nav.patientCheckin") }}
    />
    <Stack.Screen
      name="PacienteForm"
      component={PacienteFormScreen}
      options={{ title: t("patient.editMyData") }}
    />
    <Stack.Screen
      name="AnamneseForm"
      component={AnamneseFormScreen}
      options={{ title: t("nav.newAnamnesis") }}
    />
    <Stack.Screen
      name="PacienteInviteSignup"
      component={PacienteInviteSignupScreen}
      options={{ title: t("nav.inviteSignup") }}
    />
  </Stack.Navigator>
);

const MasterAdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
      headerTitleStyle: { fontWeight: "600" },
    }}
  >
    <Stack.Screen
      name="AdminHome"
      component={AdminMasterHomeScreen}
      options={{ title: "ADM Master" }}
    />
    <Stack.Screen
      name="AdminCrm"
      component={AdminCrmScreen}
      options={{ title: "CRM (ADM Master)" }}
    />
  </Stack.Navigator>
);

export function Navigation() {
  const {
    isAuthenticated,
    isLoading,
    loadStoredAuth,
    usuario,
    pendingInviteToken,
    clearPendingInviteToken,
    logout,
  } = useAuthStore();
  const { t } = useLanguage();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutMs = 30 * 60 * 1000;
  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      logout().catch(() => undefined);
    }, idleTimeoutMs);
  }, [idleTimeoutMs, isAuthenticated, logout]);
  const initialWebPathRef = useRef<string>(
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.pathname
      : "",
  );
  const webPath =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.pathname
      : "";
  const intendedAdminPath =
    initialWebPathRef.current.startsWith("/admin") ||
    webPath.startsWith("/admin");
  const shouldOpenAdminWeb =
    Platform.OS === "web" &&
    isAuthenticated &&
    usuario?.role === UserRole.ADMIN &&
    intendedAdminPath;

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [isAuthenticated, resetIdleTimer]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = () => resetIdleTimer();
    window.addEventListener("mousemove", handler);
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (
      !pendingInviteToken ||
      !isAuthenticated ||
      usuario?.role !== UserRole.PACIENTE ||
      !navigationRef.isReady()
    ) {
      return;
    }

    navigationRef.navigate("PacienteInviteSignup", {
      convite: pendingInviteToken,
    });
    clearPendingInviteToken();
  }, [
    clearPendingInviteToken,
    isAuthenticated,
    navigationRef,
    pendingInviteToken,
    usuario?.role,
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <View
        style={{ flex: 1 }}
        onTouchStart={resetIdleTimer}
        onTouchMove={resetIdleTimer}
        onTouchEnd={resetIdleTimer}
      >
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onStateChange={resetIdleTimer}
        >
          {shouldOpenAdminWeb ? (
            <MasterAdminStack />
          ) : isAuthenticated ? (
            usuario?.role === UserRole.PACIENTE ? (
              <PatientStack t={t} />
            ) : (
              <MainStack t={t} />
            )
          ) : (
            <AuthStack t={t} />
          )}
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  homeHeaderLogo: {
    width: 300,
    height: 40,
    marginLeft: -70,
  },
  backButton: {
    paddingRight: 10,
    marginLeft: 8,
  },
  backButtonList: {
    paddingRight: 10,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});












