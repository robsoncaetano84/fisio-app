// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// T OA ST
// ==========================================
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from "../../constants/theme";

type ToastType = "error" | "success" | "info";

type ToastOptions = {
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ message, type = "error", durationMs = 3000 }: ToastOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setToast({ visible: true, message, type });
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      timeoutRef.current = setTimeout(hideToast, durationMs);
    },
    [hideToast, opacity, translateY],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            stylesByType[toast.type],
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  toastText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
  },
});

const stylesByType = StyleSheet.create({
  error: { backgroundColor: COLORS.error },
  success: { backgroundColor: COLORS.success },
  info: { backgroundColor: COLORS.primary },
});
