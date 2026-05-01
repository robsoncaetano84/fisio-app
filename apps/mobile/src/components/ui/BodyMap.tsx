import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  Image as SvgImage,
  Path,
  Rect,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";
import { AreaAfetada, Sexo } from "../../types";
import {
  BODY_HALF_WIDTH,
  BODY_MAP_DIMENSIONS,
  BODY_REGION_MASKS_BY_VARIANT,
  BODY_VIEWBOX,
  BodyMapMask,
  BodyMapShape,
  BodySide,
  BodyVariant,
  BodyView,
} from "./BodyMapMasks";

interface BodyMapProps {
  selectedAreas: AreaAfetada[];
  onAreasChange: (areas: AreaAfetada[]) => void;
  sexo?: Sexo | string | null;
}

const BODY_MAP_IMAGES = {
  masculino: require("../../../assets/body-map/masculino-frente-costas-sem-faixa.png"),
  feminino: require("../../../assets/body-map/feminino-frente-costas-sem-faixa.png"),
};

const BODY_MAP_RED_IMAGES = {
  masculino: require("../../../assets/body-map/masculino-vermelho-frente-costas-sem-faixa.png"),
  feminino: require("../../../assets/body-map/feminino-vermelho-frente-costas-sem-faixa.png"),
};

const BODY_MAP_EXACT_OVERLAYS: Record<BodyVariant, Record<string, number>> = {
  masculino: {
    anterior_punho_mao_esquerdo: require("../../../assets/body-map/masculino-overlay-anterior-punho-mao-esquerdo.png"),
    anterior_punho_mao_direito: require("../../../assets/body-map/masculino-overlay-anterior-punho-mao-direito.png"),
    posterior_punho_mao_esquerdo: require("../../../assets/body-map/masculino-overlay-posterior-punho-mao-esquerdo.png"),
    posterior_punho_mao_direito: require("../../../assets/body-map/masculino-overlay-posterior-punho-mao-direito.png"),
    combinado_punho_mao_esquerdo: require("../../../assets/body-map/masculino-overlay-punho-mao-esquerdo.png"),
    combinado_punho_mao_direito: require("../../../assets/body-map/masculino-overlay-punho-mao-direito.png"),
    anterior_coxa_esquerdo: require("../../../assets/body-map/masculino-overlay-anterior-coxa-esquerdo-v2.png"),
    anterior_coxa_direito: require("../../../assets/body-map/masculino-overlay-anterior-coxa-direito-v2.png"),
    posterior_coxa_esquerdo: require("../../../assets/body-map/masculino-overlay-posterior-coxa-esquerdo-v2.png"),
    posterior_coxa_direito: require("../../../assets/body-map/masculino-overlay-posterior-coxa-direito-v2.png"),
    anterior_joelho_esquerdo: require("../../../assets/body-map/masculino-overlay-anterior-joelho-esquerdo-v8.png"),
    anterior_joelho_direito: require("../../../assets/body-map/masculino-overlay-anterior-joelho-direito-v8.png"),
    posterior_joelho_esquerdo: require("../../../assets/body-map/masculino-overlay-posterior-joelho-esquerdo-v8.png"),
    posterior_joelho_direito: require("../../../assets/body-map/masculino-overlay-posterior-joelho-direito-v8.png"),
    anterior_tibial_anterior_esquerdo: require("../../../assets/body-map/masculino-overlay-anterior-tibial-anterior-esquerdo.png"),
    anterior_tibial_anterior_direito: require("../../../assets/body-map/masculino-overlay-anterior-tibial-anterior-direito.png"),
    posterior_panturrilha_esquerdo: require("../../../assets/body-map/masculino-overlay-posterior-panturrilha-esquerdo.png"),
    posterior_panturrilha_direito: require("../../../assets/body-map/masculino-overlay-posterior-panturrilha-direito-v2.png"),
    combinado_tornozelo_pe_esquerdo: require("../../../assets/body-map/masculino-overlay-tornozelo-pe-esquerdo.png"),
    combinado_tornozelo_pe_direito: require("../../../assets/body-map/masculino-overlay-tornozelo-pe-direito.png"),
  },
  feminino: {
    anterior_punho_mao_esquerdo: require("../../../assets/body-map/feminino-overlay-anterior-punho-mao-esquerdo.png"),
    anterior_punho_mao_direito: require("../../../assets/body-map/feminino-overlay-anterior-punho-mao-direito.png"),
    posterior_punho_mao_esquerdo: require("../../../assets/body-map/feminino-overlay-posterior-punho-mao-esquerdo.png"),
    posterior_punho_mao_direito: require("../../../assets/body-map/feminino-overlay-posterior-punho-mao-direito.png"),
    combinado_punho_mao_esquerdo: require("../../../assets/body-map/feminino-overlay-punho-mao-esquerdo.png"),
    combinado_punho_mao_direito: require("../../../assets/body-map/feminino-overlay-punho-mao-direito.png"),
    anterior_coxa_esquerdo: require("../../../assets/body-map/feminino-overlay-anterior-coxa-esquerdo-v2.png"),
    anterior_coxa_direito: require("../../../assets/body-map/feminino-overlay-anterior-coxa-direito-v2.png"),
    posterior_coxa_esquerdo: require("../../../assets/body-map/feminino-overlay-posterior-coxa-esquerdo-v2.png"),
    posterior_coxa_direito: require("../../../assets/body-map/feminino-overlay-posterior-coxa-direito-v2.png"),
    anterior_joelho_esquerdo: require("../../../assets/body-map/feminino-overlay-anterior-joelho-esquerdo-v8.png"),
    anterior_joelho_direito: require("../../../assets/body-map/feminino-overlay-anterior-joelho-direito-v8.png"),
    posterior_joelho_esquerdo: require("../../../assets/body-map/feminino-overlay-posterior-joelho-esquerdo-v8.png"),
    posterior_joelho_direito: require("../../../assets/body-map/feminino-overlay-posterior-joelho-direito-v8.png"),
    anterior_tibial_anterior_esquerdo: require("../../../assets/body-map/feminino-overlay-anterior-tibial-anterior-esquerdo.png"),
    anterior_tibial_anterior_direito: require("../../../assets/body-map/feminino-overlay-anterior-tibial-anterior-direito.png"),
    posterior_panturrilha_esquerdo: require("../../../assets/body-map/feminino-overlay-posterior-panturrilha-esquerdo.png"),
    posterior_panturrilha_direito: require("../../../assets/body-map/feminino-overlay-posterior-panturrilha-direito-v2.png"),
    combinado_tornozelo_pe_esquerdo: require("../../../assets/body-map/feminino-overlay-tornozelo-pe-esquerdo.png"),
    combinado_tornozelo_pe_direito: require("../../../assets/body-map/feminino-overlay-tornozelo-pe-direito.png"),
  },
};

const REGION_LABELS: Record<string, string> = {
  cabeca: "Cabeca",
  pescoco: "Pescoco",
  ombro: "Ombro",
  braco: "Braco",
  cotovelo: "Cotovelo",
  punho_mao: "Punho/Mao",
  torax: "Torax",
  abdomen: "Abdomen",
  coluna_cervical: "Cervical",
  coluna_toracica: "Toracica",
  coluna_lombar: "Lombar",
  coxofemoral: "Coxofemoral",
  coxa: "Coxa",
  joelho: "Joelho",
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
  "punho_mao",
  "torax",
  "coluna_toracica",
  "abdomen",
  "coluna_lombar",
  "coxofemoral",
  "coxa",
  "joelho",
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

const normalizeVariant = (sexo?: Sexo | string | null): BodyVariant => {
  const normalized = String(sexo || "").toUpperCase();
  if (normalized === Sexo.FEMININO || normalized.startsWith("F")) {
    return "feminino";
  }
  return "masculino";
};

const normalizeAreaView = (area: AreaAfetada): BodyView =>
  area.vista === "posterior" ? "posterior" : "anterior";

const normalizeAreaSide = (area: AreaAfetada): BodySide => {
  if (area.lado === "esquerdo" || area.lado === "direito") return area.lado;
  return "ambos";
};

const areaKey = (area: Pick<AreaAfetada, "regiao" | "vista" | "lado">) =>
  `${area.regiao}:${area.vista || "anterior"}:${area.lado || "ambos"}`;

const maskAreaKey = (mask: BodyMapMask) =>
  `${mask.regiao}:${mask.vista}:${mask.lado}`;

const clipId = (variant: BodyVariant, mask: BodyMapMask) =>
  `body-map-${variant}-${mask.key}`.replace(/[^a-zA-Z0-9_-]/g, "-");

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

const displayAreaKey = (area: AreaAfetada) =>
  shouldAreaBehaveAsCombined(area)
    ? `${area.regiao}:${area.lado || "ambos"}:combinado`
    : areaKey(area);

const buildDisplayAreas = (areas: AreaAfetada[]) => {
  const seen = new Set<string>();
  return sortSelectedAreas(areas).filter((area) => {
    const key = displayAreaKey(area);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const overlayOpacity = (area?: AreaAfetada) => {
  const intensity = Math.max(1, Math.min(10, Number(area?.intensidade || 6)));
  if (intensity >= 8) return 0.9;
  if (intensity >= 5) return 0.78;
  return 0.66;
};

const exactOverlayKeyCandidates = (mask: BodyMapMask) => {
  const viewKey = `${mask.vista}_${mask.regiao}_${mask.lado}`;
  const combinedKey = `combinado_${mask.regiao}_${mask.lado}`;

  if (mask.regiao === "punho_mao" || mask.regiao === "tornozelo_pe") {
    return [combinedKey, viewKey];
  }

  return [viewKey, combinedKey];
};

const exactOverlayKey = (
  variant: BodyVariant,
  mask: BodyMapMask,
): string | null =>
  exactOverlayKeyCandidates(mask).find(
    (key) => Boolean(BODY_MAP_EXACT_OVERLAYS[variant][key]),
  ) || null;

const shouldToggleAsCombinedRegion = (mask: BodyMapMask) =>
  mask.regiao === "punho_mao" || mask.regiao === "tornozelo_pe";

const shouldAreaBehaveAsCombined = (area: AreaAfetada) =>
  area.regiao === "punho_mao" || area.regiao === "tornozelo_pe";

const sideLabel = (side?: AreaAfetada["lado"]) => {
  if (side === "ambos") return "Ambos";
  if (side === "esquerdo") return "Esq.";
  return "Dir.";
};

const areaLabel = (area: AreaAfetada) => {
  if (area.regiao === "torax" && area.vista === "posterior") {
    return "Costas";
  }
  return REGION_LABELS[area.regiao] || area.regiao;
};

const areaMetaLabel = (area: AreaAfetada, intensity: number) => {
  const side = sideLabel(area.lado);
  if (shouldAreaBehaveAsCombined(area)) {
    return `${side} frente e costas - dor ${intensity}/10`;
  }
  return `${side} ${area.vista === "posterior" ? "costas" : "frente"} - dor ${intensity}/10`;
};

const touchPriority = (mask: BodyMapMask) => {
  if (mask.regiao === "joelho") return 30;
  if (mask.regiao === "cotovelo") return 25;
  if (mask.regiao === "punho_mao" || mask.regiao === "tornozelo_pe") return 20;
  if (mask.regiao === "panturrilha" || mask.regiao === "tibial_anterior") return 10;
  return 0;
};

export function BodyMap({ selectedAreas, onAreasChange, sexo }: BodyMapProps) {
  const variant = normalizeVariant(sexo);
  const selectedDisplayAreas = buildDisplayAreas(selectedAreas);
  const dimensions = BODY_MAP_DIMENSIONS[variant];
  const regionMasks = BODY_REGION_MASKS_BY_VARIANT[variant];
  const prioritizedTouchMasks = [...regionMasks].sort(
    (a, b) => touchPriority(a) - touchPriority(b),
  );

  const findArea = (mask: BodyMapMask) =>
    selectedAreas.find((area) => areaKey(area) === maskAreaKey(mask));

  const toggleMask = (mask: BodyMapMask) => {
    const targetMasks = shouldToggleAsCombinedRegion(mask)
      ? regionMasks.filter(
          (candidate) =>
            candidate.regiao === mask.regiao && candidate.lado === mask.lado,
        )
      : [mask];
    const targetKeys = new Set(targetMasks.map(maskAreaKey));
    const allTargetsSelected = targetMasks.every((candidate) => findArea(candidate));

    if (allTargetsSelected) {
      onAreasChange(
        selectedAreas.filter((area) => !targetKeys.has(areaKey(area))),
      );
      return;
    }

    const existingKeys = new Set(selectedAreas.map(areaKey));
    const nextAreas: AreaAfetada[] = targetMasks
      .filter((candidate) => !existingKeys.has(maskAreaKey(candidate)))
      .map((candidate) => ({
        regiao: candidate.regiao,
        lado: candidate.lado,
        vista: candidate.vista,
        intensidade: 6,
        observacao: "",
      }));

    onAreasChange([...selectedAreas, ...nextAreas]);
  };

  const removeArea = (selectedKey: string) => {
    const selectedArea = selectedAreas.find((area) => areaKey(area) === selectedKey);

    if (selectedArea && shouldAreaBehaveAsCombined(selectedArea)) {
      onAreasChange(
        selectedAreas.filter(
          (area) =>
            area.regiao !== selectedArea.regiao || area.lado !== selectedArea.lado,
        ),
      );
      return;
    }

    onAreasChange(selectedAreas.filter((area) => areaKey(area) !== selectedKey));
  };

  const changeIntensity = (selectedKey: string, delta: number) => {
    const selectedArea = selectedAreas.find((area) => areaKey(area) === selectedKey);
    onAreasChange(
      selectedAreas.map((area) => {
        const shouldUpdate = selectedArea && shouldAreaBehaveAsCombined(selectedArea)
          ? area.regiao === selectedArea.regiao && area.lado === selectedArea.lado
          : areaKey(area) === selectedKey;
        if (!shouldUpdate) return area;
        const next = Math.max(1, Math.min(10, Number(area.intensidade || 6) + delta));
        return { ...area, intensidade: next };
      }),
    );
  };

  const changeObservation = (selectedKey: string, observacao: string) => {
    const selectedArea = selectedAreas.find((area) => areaKey(area) === selectedKey);
    onAreasChange(
      selectedAreas.map((area) => {
        const shouldUpdate = selectedArea && shouldAreaBehaveAsCombined(selectedArea)
          ? area.regiao === selectedArea.regiao && area.lado === selectedArea.lado
          : areaKey(area) === selectedKey;
        return shouldUpdate ? { ...area, observacao } : area;
      }),
    );
  };

  const renderShape = (
    shape: BodyMapShape,
    key: string,
    props: Record<string, number | string | (() => void)>,
  ) => {
    if (shape.shape === "ellipse") {
      return <Ellipse key={key} {...shape.props} {...props} />;
    }
    if (shape.shape === "path") {
      return <Path key={key} {...shape.props} {...props} />;
    }
    return <Rect key={key} {...shape.props} {...props} />;
  };

  const selectedMasks = regionMasks.filter((mask) => Boolean(findArea(mask)));
  const selectedExactOverlayKeys = Array.from(
    new Set(
      selectedMasks
        .map((mask) => exactOverlayKey(variant, mask))
        .filter((key): key is string => Boolean(key)),
    ),
  );
  const selectedFallbackMasks = selectedMasks.filter(
    (mask) => !exactOverlayKey(variant, mask),
  );

  const renderClipPath = (mask: BodyMapMask) => {
    const xOffset = mask.vista === "anterior" ? 0 : BODY_HALF_WIDTH;
    const clipShapeProps = {
      fill: "#000000",
      stroke: "transparent",
      strokeWidth: 0,
    };

    return (
      <ClipPath key={`clip-${mask.key}`} id={clipId(variant, mask)}>
        <G transform={`translate(${xOffset} 0)`}>
          {mask.visual.map((shape, index) =>
            renderShape(shape, `${mask.key}-clip-${index}`, clipShapeProps),
          )}
        </G>
      </ClipPath>
    );
  };

  const renderRedOverlay = (mask: BodyMapMask) => {
    const area = findArea(mask);
    if (!area) return null;

    return (
      <SvgImage
        key={`overlay-${mask.key}`}
        href={BODY_MAP_RED_IMAGES[variant]}
        x={0}
        y={0}
        width={BODY_VIEWBOX.width}
        height={BODY_VIEWBOX.height}
        preserveAspectRatio="none"
        clipPath={`url(#${clipId(variant, mask)})`}
        opacity={overlayOpacity(area)}
      />
    );
  };

  const renderExactOverlay = (overlayKey: string) => {
    const source = BODY_MAP_EXACT_OVERLAYS[variant][overlayKey];
    if (!source) return null;

    return (
      <SvgImage
        key={`exact-overlay-${overlayKey}`}
        href={source}
        x={0}
        y={0}
        width={BODY_VIEWBOX.width}
        height={BODY_VIEWBOX.height}
        preserveAspectRatio="none"
        opacity={1}
      />
    );
  };

  const renderTouchTarget = (mask: BodyMapMask) => {
    const xOffset = mask.vista === "anterior" ? 0 : BODY_HALF_WIDTH;
    const commonProps = {
      stroke: "transparent",
      strokeWidth: 0,
      fill: "rgba(255,255,255,0.01)",
      fillOpacity: 0.01,
      onPress: () => toggleMask(mask),
    };

    return (
      <G key={`touch-${mask.key}`} transform={`translate(${xOffset} 0)`}>
        {mask.touch.map((shape, index) =>
          renderShape(shape, `${mask.key}-touch-${index}`, commonProps),
        )}
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa corporal</Text>
      <Text style={styles.subtitle}>
        Toque na regiao da frente ou costas para marcar dor e intensidade.
      </Text>

      <View style={styles.viewLabelRow}>
        <Text style={styles.viewLabel}>Frente</Text>
        <Text style={styles.viewLabel}>Costas</Text>
      </View>

      <View
        style={[
          styles.imageFrame,
          { aspectRatio: dimensions.width / dimensions.height },
        ]}
      >
        <ImageBackground
          source={BODY_MAP_IMAGES[variant]}
          resizeMode="contain"
          style={styles.bodyImage}
          imageStyle={styles.bodyImageAsset}
        >
          <Svg
            viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}
            width="100%"
            height="100%"
            style={styles.touchLayer}
          >
            <Defs>{selectedFallbackMasks.map(renderClipPath)}</Defs>
            {selectedFallbackMasks.map(renderRedOverlay)}
            {selectedExactOverlayKeys.map(renderExactOverlay)}
            {prioritizedTouchMasks.map(renderTouchTarget)}
          </Svg>
        </ImageBackground>
      </View>

      {selectedDisplayAreas.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Areas selecionadas ({selectedDisplayAreas.length})
          </Text>
          <View style={styles.selectedList}>
            {selectedDisplayAreas.map((area) => {
              const selectedKey = areaKey(area);
              const intensity = Number(area.intensidade || 6);
              return (
                <View key={displayAreaKey(area)} style={styles.selectedChip}>
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
                        style={styles.intensityButton}
                        onPress={() => changeIntensity(selectedKey, -1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="remove" size={20} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.intensityButton}
                        onPress={() => changeIntensity(selectedKey, 1)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={20} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeArea(selectedKey)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={20} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    value={area.observacao || ""}
                    onChangeText={(value) => changeObservation(selectedKey, value)}
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
  viewLabelRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  viewLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: FONTS.sizes.sm,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  imageFrame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
  },
  bodyImage: {
    width: "100%",
    height: "100%",
  },
  bodyImageAsset: {
    borderRadius: BORDER_RADIUS.md,
  },
  touchLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
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
});
