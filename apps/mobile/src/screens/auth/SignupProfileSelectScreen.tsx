// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// SIGNUP PROFILE SELECT SCREEN
// ==========================================
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../types";
import { BORDER_RADIUS, COLORS, FONTS, SHADOWS, SPACING } from "../../constants/theme";
import { useLanguage } from "../../i18n/LanguageProvider";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SignupProfileSelect">;
};

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

function OptionCard({ icon, title, subtitle, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
    </TouchableOpacity>
  );
}

export function SignupProfileSelectScreen({ navigation }: Props) {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("auth.profileSelectTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.profileSelectSubtitle")}</Text>

        <OptionCard
          icon="medkit-outline"
          title={t("auth.profileProfessionalTitle")}
          subtitle={t("auth.profileProfessionalSubtitle")}
          onPress={() => navigation.navigate("ProfessionalSignup")}
        />

        <OptionCard
          icon="person-outline"
          title={t("auth.profilePatientTitle")}
          subtitle={t("auth.profilePatientSubtitle")}
          onPress={() => navigation.navigate("PacienteInviteSignup")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "12",
    marginRight: SPACING.sm,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
});
