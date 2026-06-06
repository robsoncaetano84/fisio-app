import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { webStickyHeaderStyle, type SortDir } from "./AdminCrmScreen.utils";
import {
  focusStyle,
  sharedComponentStyles as styles,
} from "./AdminCrmScreen.component-shared";
import { SmallBtn } from "./AdminCrmScreen.control-components";

export function Row({
  cols,
  onPress,
  selected,
}: {
  cols: string[];
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={cols.join(" - ")}
      hitSlop={6}
      style={(state) => [
        styles.row,
        selected && styles.selected,
        focusStyle(state),
      ]}
    >
      {cols.map((col, index) => (
        <Text
          key={`${index}-${col}`}
          style={[styles.rowCell, index === 0 && styles.rowCellPrimary]}
        >
          {col}
        </Text>
      ))}
    </Pressable>
  );
}

export function HeadSortable<T extends string>({
  cols,
  sort,
  onSortChange,
}: {
  cols: Array<{ key: T; label: string }>;
  sort: { key: T; dir: SortDir };
  onSortChange: (key: T) => void;
}) {
  return (
    <View
      style={[
        styles.head,
        Platform.OS === "web" ? webStickyHeaderStyle : null,
      ]}
    >
      {cols.map((col) => {
        const active = sort.key === col.key;
        const arrow = active ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
        return (
          <Pressable
            key={col.key}
            onPress={() => onSortChange(col.key)}
            accessibilityRole="button"
            accessibilityLabel={`${col.label}${
              active
                ? `, ordenado ${sort.dir === "asc" ? "crescente" : "decrescente"}`
                : ""
            }`}
            hitSlop={6}
            style={(state) => [styles.headBtn, focusStyle(state)]}
          >
            <Text style={[styles.headText, active && styles.headTextActive]}>
              {col.label}
              {arrow}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
  previousLabel,
  nextLabel,
  pageOfLabel,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <SmallBtn
        title={previousLabel}
        onPress={() => onChange(Math.max(1, page - 1))}
      />
      <Text style={styles.paginationText}>{pageOfLabel}</Text>
      <SmallBtn
        title={nextLabel}
        onPress={() => onChange(Math.min(totalPages, page + 1))}
      />
    </View>
  );
}
