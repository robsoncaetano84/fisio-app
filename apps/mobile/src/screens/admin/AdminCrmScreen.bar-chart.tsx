import React from "react";
import { Text, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { sharedComponentStyles as styles } from "./AdminCrmScreen.component-shared";

export function BarChart({
  items,
  formatValue,
  maxValue,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
  formatValue?: (value: number) => string | number;
  maxValue?: number;
}) {
  const max = Math.max(
    1,
    maxValue ?? Math.max(1, ...items.map((item) => item.value || 0)),
  );
  return (
    <View style={styles.chartWrap}>
      {items.map((item) => {
        const pct = Math.max(
          0,
          Math.min(100, Math.round(((item.value || 0) / max) * 100)),
        );
        return (
          <View key={item.label} style={styles.chartRow}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={styles.chartValue}>
                {formatValue ? formatValue(item.value) : item.value}
              </Text>
            </View>
            <View style={styles.chartTrack}>
              <View
                style={[
                  styles.chartFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: item.color || COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
