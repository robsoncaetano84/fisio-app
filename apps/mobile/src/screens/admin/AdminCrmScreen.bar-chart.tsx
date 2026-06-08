import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { sharedComponentStyles as styles } from "./AdminCrmScreen.component-shared";

const MIN_PLOT_WIDTH = 240;
const BAR_COLUMN_WIDTH = 56;

const formatTick = (value: number) => {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
};

const getNiceMax = (value: number) => {
  if (value <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
};

export function BarChart({
  items,
  formatValue,
  maxValue,
}: {
  items: Array<{ label: string; value: number; color?: string }>;
  formatValue?: (value: number) => string | number;
  maxValue?: number;
}) {
  const chartItems = items.length
    ? items
    : [{ label: "Sem dados", value: 0, color: COLORS.gray300 }];
  const rawMax = Math.max(1, ...chartItems.map((item) => item.value || 0));
  const max = maxValue ?? getNiceMax(rawMax);
  const ticks = useMemo(
    () => [max, max * 0.75, max * 0.5, max * 0.25, 0],
    [max],
  );
  const plotWidth = Math.max(
    MIN_PLOT_WIDTH,
    chartItems.length * BAR_COLUMN_WIDTH,
  );

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartLegendRow}>
        {chartItems.map((item, index) => (
          <View
            key={`legend-${item.label}-${index}`}
            style={styles.chartLegendItem}
          >
            <View
              style={[
                styles.chartLegendDot,
                { backgroundColor: item.color || COLORS.primary },
              ]}
            />
            <Text style={styles.chartLegendText} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
      >
        <View style={styles.chartYAxis}>
          {ticks.map((tick, index) => (
            <Text key={`tick-${index}`} style={styles.chartTickLabel}>
              {formatValue ? formatValue(tick) : formatTick(tick)}
            </Text>
          ))}
        </View>
        <View style={[styles.chartPlot, { minWidth: plotWidth }]}>
          <View pointerEvents="none" style={styles.chartGrid}>
            {ticks.map((_, index) => (
              <View key={`grid-${index}`} style={styles.chartGridLine} />
            ))}
          </View>
          <View style={styles.chartBarsRow}>
            {chartItems.map((item, index) => {
              const pct = Math.max(
                0,
                Math.min(100, Math.round(((item.value || 0) / max) * 100)),
              );
              return (
                <View
                  key={`${item.label}-${index}`}
                  style={styles.chartBarColumn}
                >
                  <Text style={styles.chartValue} numberOfLines={1}>
                    {formatValue ? formatValue(item.value) : item.value}
                  </Text>
                  <View style={styles.chartBarSlot}>
                    <View
                      style={[
                        styles.chartFill,
                        {
                          height: `${pct}%`,
                          minHeight: pct > 0 ? 4 : 0,
                          backgroundColor: item.color || COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
