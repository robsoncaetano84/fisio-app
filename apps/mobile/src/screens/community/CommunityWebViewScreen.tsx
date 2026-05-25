import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView, WebViewNavigation } from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { RootStackParamList } from "../../types";
import {
  buildCommunitySsoCallbackUrl,
  createCommunitySsoSession,
  getCommunityWebUrl,
  trackEvent,
} from "../../services";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityWeb">;

export function CommunityWebViewScreen({ route }: Props) {
  const webViewRef = useRef<WebView | null>(null);
  const returnTo = route.params?.returnTo || "/";
  const [uri, setUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparingSession, setIsPreparingSession] = useState(true);
  const [isWebViewLoading, setIsWebViewLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const prepareSession = useCallback(async () => {
    setIsPreparingSession(true);
    setErrorMessage(null);
    try {
      const sso = await createCommunitySsoSession(returnTo);
      const callbackUrl = buildCommunitySsoCallbackUrl(sso, returnTo);
      setUri(callbackUrl);
      await trackEvent("community_webview_sso_created", {
        returnTo,
        expiresAt: sso.expiresAt,
      });
    } catch {
      setUri(null);
      setErrorMessage(
        "Nao foi possivel iniciar a sessao da comunidade. Verifique sua conexao e tente novamente.",
      );
      trackEvent("community_webview_sso_failed", { returnTo }).catch(
        () => undefined,
      );
    } finally {
      setIsPreparingSession(false);
    }
  }, [returnTo]);

  useEffect(() => {
    prepareSession().catch(() => undefined);
  }, [prepareSession]);

  const handleNavigationStateChange = (state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    setCanGoForward(state.canGoForward);
  };

  const openExternal = () => {
    Linking.openURL(uri || getCommunityWebUrl()).catch(() => undefined);
  };

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerCard}>
          <Ionicons name="chatbubbles-outline" size={34} color={COLORS.primary} />
          <Text style={styles.title}>Comunidade SYNAP</Text>
          <Text style={styles.description}>
            A comunidade abre em uma nova aba no ambiente web.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={openExternal}>
            <Text style={styles.primaryButtonText}>Abrir comunidade</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonOff]}
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar na comunidade"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toolbarButton,
            !canGoForward && styles.toolbarButtonOff,
          ]}
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
          accessibilityRole="button"
          accessibilityLabel="Avancar na comunidade"
        >
          <Ionicons name="arrow-forward" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            if (uri) {
              webViewRef.current?.reload();
              return;
            }
            prepareSession().catch(() => undefined);
          }}
          accessibilityRole="button"
          accessibilityLabel="Recarregar comunidade"
        >
          <Ionicons name="refresh" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={openExternal}
          accessibilityRole="button"
          accessibilityLabel="Abrir comunidade no navegador"
        >
          <Ionicons name="open-outline" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        {isWebViewLoading || isPreparingSession ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.toolbarLoader}
          />
        ) : null}
      </View>

      {isPreparingSession ? (
        <View style={styles.centerCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.title}>Abrindo comunidade</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerCard}>
          <Ionicons name="warning-outline" size={34} color={COLORS.warning} />
          <Text style={styles.title}>Sessao nao iniciada</Text>
          <Text style={styles.description}>{errorMessage}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={prepareSession}>
            <Text style={styles.primaryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : uri ? (
        <WebView
          ref={webViewRef}
          source={{ uri }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          onLoadStart={() => setIsWebViewLoading(true)}
          onLoadEnd={() => setIsWebViewLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onError={() => {
            setErrorMessage(
              "A comunidade nao respondeu. Recarregue ou abra no navegador.",
            );
            setUri(null);
          }}
          renderLoading={() => (
            <View style={styles.webLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toolbarButton: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  toolbarButtonOff: {
    opacity: 0.35,
  },
  toolbarLoader: {
    marginLeft: "auto",
  },
  centerCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 21,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
  },
  webLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});
