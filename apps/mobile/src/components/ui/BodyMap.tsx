import React, { useMemo, useState } from "react";
import {
  Platform,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";
import { AreaAfetada, Sexo } from "../../types";
import {
  BodyMapPoint,
  BodyMapPointOverrides,
  BODY_MAP_PANEL_ASPECT_RATIO,
  BodySex,
  SelectedBodyRegion,
  bodyMapPointKey,
  getBodyMapPoints,
} from "./body-map-points.config";
import { BodyMapSide } from "./BodyMapSide";

interface BodyMapProps {
  selectedAreas?: AreaAfetada[];
  onAreasChange?: (areas: AreaAfetada[]) => void;
  sexo?: Sexo | string | null;
  sex?: BodySex;
  selectedRegions?: SelectedBodyRegion[];
  onChange?: (regions: SelectedBodyRegion[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  editable?: boolean;
}

const BODY_MAP_COMBINED_IMAGES = {
  masculino: require("../../../assets/body-map/masculino-frente-costas-sem-faixa.png"),
  feminino: require("../../../assets/body-map/feminino-frente-costas-sem-faixa.png"),
};

const REGION_LABELS: Record<string, string> = {
  cabeca: "Cabeca",
  pescoco: "Pescoco",
  ombro: "Ombro",
  braco: "Braco",
  cotovelo: "Cotovelo",
  antebraco: "Antebraco",
  punho_mao: "Punho/Mao",
  torax: "Torax",
  abdomen: "Abdomen",
  coluna_cervical: "Cervical",
  coluna_toracica: "Toracica",
  coluna_lombar: "Lombar",
  sacro: "Sacro",
  coxofemoral: "Coxofemoral",
  gluteo: "Gluteo",
  coxa: "Coxa",
  posterior_coxa: "Posterior coxa",
  joelho: "Joelho",
  popliteo: "Popliteo",
  tibial_anterior: "Tibial anterior",
  panturrilha: "Panturrilha",
  tornozelo_pe: "Tornozelo/Pe",
};

const CHAIN_ORDER = [
  "cabeca",
  "pescoco",
  "coluna_cervical",
  "ombro",
  "braco",
  "cotovelo",
  "antebraco",
  "punho_mao",
  "torax",
  "coluna_toracica",
  "abdomen",
  "coluna_lombar",
  "sacro",
  "coxofemoral",
  "gluteo",
  "coxa",
  "posterior_coxa",
  "joelho",
  "popliteo",
  "tibial_anterior",
  "panturrilha",
  "tornozelo_pe",
];

const VIEW_ORDER: Record<string, number> = {
  anterior: 0,
  posterior: 1,
};

const SIDE_ORDER: Record<string, number> = {
  direito: 0,
  ambos: 1,
  esquerdo: 2,
};

const normalizeSex = (sex?: BodySex, sexo?: Sexo | string | null): BodySex => {
  if (sex) return sex;
  const normalized = String(sexo || "").toUpperCase();
  if (normalized === Sexo.FEMININO || normalized.startsWith("F")) {
    return "feminino";
  }
  return "masculino";
};

const normalizeAreaView = (area: AreaAfetada) =>
  area.vista === "posterior" ? "posterior" : "anterior";

const normalizeAreaSide = (area: AreaAfetada) => {
  if (area.lado === "esquerdo" || area.lado === "direito") return area.lado;
  return "ambos";
};

const pointSideToAreaSide = (point: BodyMapPoint): AreaAfetada["lado"] =>
  point.side === "esquerdo" || point.side === "direito" ? point.side : "ambos";

const areaKey = (area: Pick<AreaAfetada, "regiao" | "vista" | "lado">) =>
  `${area.regiao}:${area.vista || "anterior"}:${area.lado || "ambos"}`;

const pointAreaKey = (point: BodyMapPoint) =>
  `${point.regionKey || point.id}:${point.view}:${pointSideToAreaSide(point)}`;

const sortSelectedAreas = (areas: AreaAfetada[]) =>
  [...areas].sort((a, b) => {
    const chainA = CHAIN_ORDER.indexOf(a.regiao);
    const chainB = CHAIN_ORDER.indexOf(b.regiao);
    if (chainA !== chainB) {
      return (chainA === -1 ? 999 : chainA) - (chainB === -1 ? 999 : chainB);
    }
    const viewA = VIEW_ORDER[normalizeAreaView(a)] ?? 0;
    const viewB = VIEW_ORDER[normalizeAreaView(b)] ?? 0;
    if (viewA !== viewB) return viewA - viewB;
    const sideA = SIDE_ORDER[normalizeAreaSide(a)] ?? 1;
    const sideB = SIDE_ORDER[normalizeAreaSide(b)] ?? 1;
    return sideA - sideB;
  });

const sideLabel = (side?: AreaAfetada["lado"], short = false) => {
  if (side === "ambos") return short ? "Ambos" : "Ambos";
  if (side === "esquerdo") return short ? "Esq." : "Esquerdo";
  return short ? "Dir." : "Direito";
};

const viewLabel = (view?: AreaAfetada["vista"]) =>
  view === "posterior" ? "costas" : "frente";

const areaLabel = (area: AreaAfetada) =>
  REGION_LABELS[area.regiao] || area.regiao;

const areaMetaLabel = (area: AreaAfetada, intensity?: number) =>
  `${sideLabel(area.lado)} ${viewLabel(area.vista)} - ${
    typeof intensity === "number" ? `dor ${intensity}/10` : "dor nao informada"
  }`;

const selectedRegionToPointKey = (region: SelectedBodyRegion) =>
  `${region.sex}:${region.view}:${region.id}`;

const pointToSelectedRegion = (point: BodyMapPoint): SelectedBodyRegion => ({
  id: point.id,
  label: point.label,
  sex: point.sex,
  view: point.view,
  side: point.side,
});

const pointToArea = (point: BodyMapPoint): AreaAfetada => ({
  regiao: point.regionKey || point.id,
  lado: pointSideToAreaSide(point),
  vista: point.view,
  observacao: "",
});

const buildSelectedPointKeys = (
  points: BodyMapPoint[],
  selectedAreas: AreaAfetada[],
  selectedRegions: SelectedBodyRegion[],
) => {
  const keys = new Set<string>();
  const selectedAreaKeys = new Set(selectedAreas.map(areaKey));

  points.forEach((point) => {
    if (selectedAreaKeys.has(pointAreaKey(point))) {
      keys.add(bodyMapPointKey(point));
    }
  });

  selectedRegions.forEach((region) =>
    keys.add(selectedRegionToPointKey(region)),
  );

  return keys;
};

const buildRegionsFromKeys = (points: BodyMapPoint[], keys: Set<string>) =>
  points
    .filter((point) => keys.has(bodyMapPointKey(point)))
    .map(pointToSelectedRegion);

const buildCalibrationJson = (sex: BodySex, points: BodyMapPoint[]) =>
  JSON.stringify(
    {
      sex,
      posterior: points
        .filter((point) => point.view === "posterior")
        .map(({ id, label, side, xPercent, yPercent, group, regionKey }) => ({
          id,
          label,
          side,
          xPercent: Number(xPercent.toFixed(2)),
          yPercent: Number(yPercent.toFixed(2)),
          group,
          regionKey,
        })),
      anterior: points
        .filter((point) => point.view === "anterior")
        .map(({ id, label, side, xPercent, yPercent, group, regionKey }) => ({
          id,
          label,
          side,
          xPercent: Number(xPercent.toFixed(2)),
          yPercent: Number(yPercent.toFixed(2)),
          group,
          regionKey,
        })),
    },
    null,
    2,
  );

export function BodyMap({
  selectedAreas = [],
  onAreasChange,
  sexo,
  sex,
  selectedRegions = [],
  onChange,
  multiple = true,
  disabled = false,
  editable = false,
}: BodyMapProps) {
  const resolvedSex = normalizeSex(sex, sexo);
  const [runtimeOverrides, setRuntimeOverrides] =
    useState<BodyMapPointOverrides>({});
  const [mapWidth, setMapWidth] = useState(0);
  const { width: viewportWidth } = useWindowDimensions();
  const measuredOrFallbackMapWidth =
    mapWidth > 0
      ? mapWidth
      : Platform.OS === "web"
        ? Math.min(Math.max(viewportWidth - SPACING.md * 2, 0), 560)
        : 0;
  const isCompactMap =
    measuredOrFallbackMapWidth > 0 && measuredOrFallbackMapWidth < 560;
  const mapInnerWidth = Math.max(
    0,
    measuredOrFallbackMapWidth - SPACING.xs * 2,
  );
  const sidePanelWidth =
    mapInnerWidth > 0
      ? isCompactMap
        ? Math.min(mapInnerWidth, 360)
        : Math.max(0, (mapInnerWidth - SPACING.xs) / 2)
      : undefined;
  const compactMapMinHeight =
    isCompactMap && sidePanelWidth
      ? sidePanelWidth / BODY_MAP_PANEL_ASPECT_RATIO
      : undefined;

  const posteriorPoints = useMemo(
    () => getBodyMapPoints(resolvedSex, "posterior", runtimeOverrides),
    [resolvedSex, runtimeOverrides],
  );
  const anteriorPoints = useMemo(
    () => getBodyMapPoints(resolvedSex, "anterior", runtimeOverrides),
    [resolvedSex, runtimeOverrides],
  );
  const allPoints = useMemo(
    () => [...posteriorPoints, ...anteriorPoints],
    [posteriorPoints, anteriorPoints],
  );

  const selectedPointKeys = useMemo(
    () => buildSelectedPointKeys(allPoints, selectedAreas, selectedRegions),
    [allPoints, selectedAreas, selectedRegions],
  );

  const selectedDisplayAreas = useMemo(
    () => sortSelectedAreas(selectedAreas),
    [selectedAreas],
  );

  const emitRegionChange = (nextPointKeys: Set<string>) => {
    onChange?.(buildRegionsFromKeys(allPoints, nextPointKeys));
  };

  const togglePoint = (point: BodyMapPoint) => {
    if (disabled) return;

    const targetPointKey = bodyMapPointKey(point);
    const targetAreaKey = pointAreaKey(point);
    const isSelected = selectedPointKeys.has(targetPointKey);
    const nextPointKeys = multiple
      ? new Set(selectedPointKeys)
      : new Set<string>();

    if (isSelected) {
      nextPointKeys.delete(targetPointKey);
    } else {
      nextPointKeys.add(targetPointKey);
    }

    if (onAreasChange) {
      if (!multiple) {
        onAreasChange(isSelected ? [] : [pointToArea(point)]);
      } else if (isSelected) {
        onAreasChange(
          selectedAreas.filter((area) => areaKey(area) !== targetAreaKey),
        );
      } else {
        onAreasChange([...selectedAreas, pointToArea(point)]);
      }
    }

    emitRegionChange(nextPointKeys);
  };

  const movePoint = (
    point: BodyMapPoint,
    xPercent: number,
    yPercent: number,
  ) => {
    if (!editable) return;
    setRuntimeOverrides((current) => ({
      ...current,
      [point.sex]: {
        ...current[point.sex],
        [point.view]: {
          ...current[point.sex]?.[point.view],
          [point.id]: {
            ...current[point.sex]?.[point.view]?.[point.id],
            xPercent,
            yPercent,
          },
        },
      },
    }));
  };

  const removeArea = (selectedKey: string) => {
    onAreasChange?.(
      selectedAreas.filter((area) => areaKey(area) !== selectedKey),
    );
    const nextPointKeys = new Set(selectedPointKeys);
    const point = allPoints.find(
      (candidate) => pointAreaKey(candidate) === selectedKey,
    );
    if (point) {
      nextPointKeys.delete(bodyMapPointKey(point));
    }
    emitRegionChange(nextPointKeys);
  };

  const changeIntensity = (selectedKey: string, delta: number) => {
    onAreasChange?.(
      selectedAreas.map((area) => {
        if (areaKey(area) !== selectedKey) return area;
        const current =
          typeof area.intensidade === "number" &&
          Number.isFinite(area.intensidade)
            ? area.intensidade
            : 0;
        const next = Math.max(0, Math.min(10, current + delta));
        return { ...area, intensidade: next };
      }),
    );
  };

  const changeObservation = (selectedKey: string, observacao: string) => {
    onAreasChange?.(
      selectedAreas.map((area) =>
        areaKey(area) === selectedKey ? { ...area, observacao } : area,
      ),
    );
  };

  const calibrationJson = useMemo(
    () => buildCalibrationJson(resolvedSex, allPoints),
    [allPoints, resolvedSex],
  );

  const exportCalibration = () => {
    if (Platform.OS === "web") {
      const maybeNavigator = globalThis.navigator as
        | (Navigator & {
            clipboard?: { writeText: (value: string) => Promise<void> };
          })
        | undefined;
      maybeNavigator?.clipboard
        ?.writeText(calibrationJson)
        .catch(() => undefined);
    }
  };

  const handleMapLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setMapWidth(width);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa corporal</Text>
      <Text style={styles.subtitle}>
        Toque nos pontos para marcar dor e intensidade.
      </Text>

      <View
        style={[
          styles.mapSurface,
          isCompactMap && styles.mapSurfaceCompact,
          compactMapMinHeight ? { minHeight: compactMapMinHeight * 2 } : null,
        ]}
        onLayout={handleMapLayout}
      >
        <BodyMapSide
          sex={resolvedSex}
          view="anterior"
          source={BODY_MAP_COMBINED_IMAGES[resolvedSex]}
          imageHalf="left"
          panelWidth={sidePanelWidth}
          points={anteriorPoints}
          selectedKeys={selectedPointKeys}
          disabled={disabled}
          editable={editable}
          compact={isCompactMap}
          onTogglePoint={togglePoint}
          onMovePoint={movePoint}
        />
        <BodyMapSide
          sex={resolvedSex}
          view="posterior"
          source={BODY_MAP_COMBINED_IMAGES[resolvedSex]}
          imageHalf="right"
          panelWidth={sidePanelWidth}
          points={posteriorPoints}
          selectedKeys={selectedPointKeys}
          disabled={disabled}
          editable={editable}
          compact={isCompactMap}
          onTogglePoint={togglePoint}
          onMovePoint={movePoint}
        />
      </View>

      {selectedDisplayAreas.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Areas selecionadas ({selectedDisplayAreas.length})
          </Text>
          <View style={styles.selectedList}>
            {selectedDisplayAreas.map((area) => {
              const selectedKey = areaKey(area);
              const intensity =
                typeof area.intensidade === "number" &&
                Number.isFinite(area.intensidade)
                  ? area.intensidade
                  : undefined;
              return (
                <View key={selectedKey} style={styles.selectedChip}>
                  <View style={styles.selectedChipHeader}>
                    <View style={styles.chipTextBlock}>
                      <Text style={styles.selectedChipText}>
                        {areaLabel(area)}
                      </Text>
                      <Text style={styles.selectedChipMeta}>
                        {areaMetaLabel(area, intensity)}
                      </Text>
                    </View>
                    <View style={styles.intensityControls}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Diminuir dor em ${areaLabel(area)}`}
                        disabled={disabled}
                        style={[
                          styles.intensityButton,
                          disabled && styles.disabledControl,
                        ]}
                        onPress={() => changeIntensity(selectedKey, -1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="remove"
                          size={22}
                          color={COLORS.white}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Aumentar dor em ${areaLabel(area)}`}
                        disabled={disabled}
                        style={[
                          styles.intensityButton,
                          disabled && styles.disabledControl,
                        ]}
                        onPress={() => changeIntensity(selectedKey, 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={22} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Remover ${areaLabel(area)}`}
                        disabled={disabled}
                        style={[
                          styles.removeButton,
                          disabled && styles.disabledControl,
                        ]}
                        onPress={() => removeArea(selectedKey)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={22} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    value={area.observacao || ""}
                    editable={!disabled}
                    onChangeText={(value) =>
                      changeObservation(selectedKey, value)
                    }
                    placeholder="Observacao clinica da area"
                    placeholderTextColor="rgba(255,255,255,0.72)"
                    style={styles.observationInput}
                    multiline
                  />
                </View>
              );
            })}
          </View>
        </View>
      )}

      {editable && (
        <View style={styles.calibrationPanel}>
          <View style={styles.calibrationHeader}>
            <Text style={styles.calibrationTitle}>Calibracao dos pontos</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Copiar JSON de calibracao"
              style={styles.exportButton}
              onPress={exportCalibration}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.white} />
              <Text style={styles.exportButtonText}>Copiar JSON</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.calibrationHint}>
            Arraste um ponto para ajustar xPercent/yPercent. O JSON tambem e
            enviado ao console.
          </Text>
          <TextInput
            value={calibrationJson}
            editable={false}
            multiline
            style={styles.calibrationOutput}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  mapSurface: {
    width: "100%",
    flexDirection: "row",
    gap: SPACING.xs,
    padding: SPACING.xs,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
  },
  mapSurfaceCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: SPACING.sm,
  },
  selectedContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  selectedList: {
    gap: SPACING.sm,
  },
  selectedChip: {
    width: "100%",
    minHeight: 98,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  selectedChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  chipTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  selectedChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: "800",
  },
  selectedChipMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    marginTop: 2,
  },
  intensityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  intensityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  disabledControl: {
    opacity: 0.45,
  },
  observationInput: {
    minHeight: 44,
    maxHeight: 96,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: "rgba(255,255,255,0.16)",
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    textAlignVertical: "top",
  },
  calibrationPanel: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray50,
    gap: SPACING.sm,
  },
  calibrationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  calibrationTitle: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  calibrationHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  exportButton: {
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.secondary,
  },
  exportButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xs,
    fontWeight: "700",
  },
  calibrationOutput: {
    minHeight: 150,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xs,
    textAlignVertical: "top",
  },
});
