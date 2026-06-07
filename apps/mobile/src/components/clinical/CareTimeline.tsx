import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from "../../constants/theme";
import type { CareTimelineStatus } from "../../services";

export type CareTimelineViewItem = {
  id: string;
  title: string;
  description: string;
  status: CareTimelineStatus;
  dateLabel?: string | null;
  actionLabel?: string | null;
  onPress?: (() => void) | null;
};

type Props = {
  title: string;
  subtitle?: string;
  items: CareTimelineViewItem[];
};

function getStatusMeta(status: CareTimelineStatus) {
  if (status === "DONE") {
    return {
      icon: "checkmark-circle" as const,
      color: COLORS.success,
      lineColor: COLORS.success,
    };
  }
  if (status === "CURRENT") {
    return {
      icon: "radio-button-on" as const,
      color: COLORS.primary,
      lineColor: COLORS.primary,
    };
  }
  if (status === "WAITING") {
    return {
      icon: "time-outline" as const,
      color: COLORS.warning,
      lineColor: COLORS.warning,
    };
  }
  return {
    icon: "ellipse-outline" as const,
    color: COLORS.gray500,
    lineColor: COLORS.border,
  };
}

export function CareTimeline({ title, subtitle, items }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.timeline}>
        {items.map((item, index) => {
          const meta = getStatusMeta(item.status);
          const isLast = index === items.length - 1;
          const content = (
            <View style={styles.itemRow}>
              <View style={styles.markerColumn}>
                <Ionicons name={meta.icon} size={22} color={meta.color} />
                {!isLast ? (
                  <View
                    style={[
                      styles.connector,
                      { backgroundColor: meta.lineColor },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.dateLabel ? (
                    <Text style={styles.itemDate}>{item.dateLabel}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemDescription}>{item.description}</Text>
                {item.actionLabel && item.onPress ? (
                  <View style={styles.actionRow}>
                    <Text style={styles.actionText}>{item.actionLabel}</Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          );

          if (item.onPress) {
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={item.onPress}
                style={styles.touchableItem}
              >
                {content}
              </TouchableOpacity>
            );
          }

          return (
            <View key={item.id} style={styles.touchableItem}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    width: "100%",
  },
  header: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  timeline: {
    gap: SPACING.xs,
  },
  touchableItem: {
    borderRadius: BORDER_RADIUS.sm,
  },
  itemRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  markerColumn: {
    alignItems: "center",
    width: 24,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 34,
    marginTop: 4,
    opacity: 0.45,
  },
  itemContent: {
    flex: 1,
    paddingBottom: SPACING.sm,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.base,
    fontWeight: "700",
    flex: 1,
  },
  itemDate: {
    color: COLORS.gray500,
    fontSize: FONTS.sizes.xs,
  },
  itemDescription: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 20,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.xs,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
  },
});
