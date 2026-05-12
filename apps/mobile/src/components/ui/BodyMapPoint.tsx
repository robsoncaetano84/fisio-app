import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, FONTS, SPACING } from "../../constants/theme";
import { BodyMapPoint as BodyMapPointModel, bodyMapPointKey } from "./body-map-points.config";

type PanelSize = {
  width: number;
  height: number;
};

interface BodyMapPointProps {
  point: BodyMapPointModel;
  selected: boolean;
  disabled?: boolean;
  editable?: boolean;
  panelSize?: PanelSize;
  onToggle: (point: BodyMapPointModel) => void;
  onMove?: (point: BodyMapPointModel, xPercent: number, yPercent: number) => void;
}

const SELECTED_COLOR = "#C62828";
const NORMAL_COLOR = COLORS.secondary;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function BodyMapPoint({
  point,
  selected,
  disabled = false,
  editable = false,
  panelSize,
  onToggle,
  onMove,
}: BodyMapPointProps) {
  const [showLabel, setShowLabel] = useState(false);
  const [focused, setFocused] = useState(false);
  const dragStartRef = useRef({
    xPercent: point.xPercent,
    yPercent: point.yPercent,
  });
  const didDragRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hitSize = point.hitSize || 44;
  const visibleSize = (point.visibleRadius || 8) * 2;

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Boolean(
            editable &&
              onMove &&
              panelSize?.width &&
              panelSize?.height &&
              (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
          ),
        onPanResponderGrant: () => {
          didDragRef.current = false;
          dragStartRef.current = {
            xPercent: point.xPercent,
            yPercent: point.yPercent,
          };
        },
        onPanResponderMove: (_event, gesture) => {
          if (!editable || !onMove || !panelSize?.width || !panelSize?.height) {
            return;
          }
          didDragRef.current = true;
          const nextX = clampPercent(
            dragStartRef.current.xPercent + (gesture.dx / panelSize.width) * 100,
          );
          const nextY = clampPercent(
            dragStartRef.current.yPercent + (gesture.dy / panelSize.height) * 100,
          );
          onMove(point, nextX, nextY);
        },
        onPanResponderRelease: () => {
          setTimeout(() => {
            didDragRef.current = false;
          }, 0);
        },
      }),
    [editable, onMove, panelSize?.height, panelSize?.width, point],
  );

  const revealLabel = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowLabel(true);
  };

  const hideLabel = () => {
    hideTimerRef.current = setTimeout(() => setShowLabel(false), 700);
  };

  const handlePress = () => {
    if (disabled || didDragRef.current) return;
    onToggle(point);
  };

  const webKeyboardProps =
    Platform.OS === "web"
      ? ({
          tabIndex: disabled ? -1 : 0,
          onKeyDown: (event: { key?: string; preventDefault?: () => void }) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
              event.preventDefault?.();
              onToggle(point);
            }
          },
        } as any)
      : {};

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          left: `${point.xPercent}%`,
          top: `${point.yPercent}%`,
          width: hitSize,
          height: hitSize,
          marginLeft: -hitSize / 2,
          marginTop: -hitSize / 2,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {showLabel && (
        <View pointerEvents="none" style={styles.tooltip}>
          <Text style={styles.tooltipText}>{point.label}</Text>
          {editable && (
            <Text style={styles.tooltipMeta}>
              {point.xPercent.toFixed(1)}%, {point.yPercent.toFixed(1)}%
            </Text>
          )}
        </View>
      )}

      <Pressable
        {...webKeyboardProps}
        accessibilityRole="button"
        accessibilityLabel={`${point.label}. ${selected ? "Selecionado" : "Nao selecionado"}`}
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        focusable={!disabled}
        onPress={handlePress}
        onHoverIn={revealLabel}
        onHoverOut={hideLabel}
        onFocus={() => {
          setFocused(true);
          revealLabel();
        }}
        onBlur={() => {
          setFocused(false);
          hideLabel();
        }}
        onPressIn={revealLabel}
        onPressOut={hideLabel}
        style={({ pressed }) => [
          styles.hitArea,
          focused && styles.focused,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
        testID={`body-map-point-${bodyMapPointKey(point)}`}
      >
        <View
          style={[
            styles.dot,
            {
              width: visibleSize,
              height: visibleSize,
              borderRadius: visibleSize / 2,
              backgroundColor: selected ? SELECTED_COLOR : NORMAL_COLOR,
            },
            selected && styles.selectedDot,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  hitArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  focused: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.45,
  },
  dot: {
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDot: {
    transform: [{ scale: 1.12 }],
  },
  tooltip: {
    position: "absolute",
    bottom: 42,
    minWidth: 96,
    maxWidth: 170,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    backgroundColor: "rgba(33,33,33,0.92)",
    alignItems: "center",
  },
  tooltipText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
    textAlign: "center",
  },
  tooltipMeta: {
    marginTop: 2,
    color: COLORS.gray200,
    fontSize: FONTS.sizes.xs,
    textAlign: "center",
  },
});
