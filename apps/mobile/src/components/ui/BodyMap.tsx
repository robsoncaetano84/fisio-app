// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// BODY MAP COMPONENT - Mapa Corporal
// ==========================================

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from "../../constants/theme";
import { AreaAfetada } from "../../types";

interface BodyMapProps {
  selectedAreas: AreaAfetada[];
  onAreasChange: (areas: AreaAfetada[]) => void;
}

// Regiões do corpo
const BODY_REGIONS = [
  { id: "cabeca", label: "Cabeça", icon: "happy-outline" },
  { id: "pescoco", label: "Pescoço", icon: "fitness-outline" },
  { id: "ombro", label: "Ombro", icon: "body-outline" },
  { id: "braco", label: "Braço", icon: "hand-left-outline" },
  { id: "cotovelo", label: "Cotovelo", icon: "ellipse-outline" },
  { id: "punho_mao", label: "Punho/Mão", icon: "hand-right-outline" },
  { id: "coluna_cervical", label: "Coluna Cervical", icon: "arrow-up-outline" },
  { id: "coluna_toracica", label: "Coluna Torácica", icon: "remove-outline" },
  { id: "coluna_lombar", label: "Coluna Lombar", icon: "arrow-down-outline" },
  { id: "quadril", label: "Quadril", icon: "fitness-outline" },
  { id: "coxa", label: "Coxa", icon: "walk-outline" },
  { id: "joelho", label: "Joelho", icon: "ellipse-outline" },
  { id: "panturrilha", label: "Panturrilha", icon: "footsteps-outline" },
  { id: "tornozelo_pe", label: "Tornozelo/Pé", icon: "footsteps-outline" },
  { id: "torax", label: "Tórax", icon: "heart-outline" },
  { id: "abdomen", label: "Abdômen", icon: "cellular-outline" },
];

const LADOS = [
  { id: "esquerdo", label: "Esquerdo" },
  { id: "direito", label: "Direito" },
  { id: "ambos", label: "Ambos" },
];

export function BodyMap({ selectedAreas, onAreasChange }: BodyMapProps) {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const isRegionSelected = (regionId: string) => {
    return selectedAreas.some((area) => area.regiao === regionId);
  };

  const getRegionLado = (regionId: string) => {
    const area = selectedAreas.find((a) => a.regiao === regionId);
    return area?.lado;
  };

  const toggleRegion = (regionId: string) => {
    if (expandedRegion === regionId) {
      setExpandedRegion(null);
    } else {
      setExpandedRegion(regionId);
    }
  };

  const selectLado = (
    regionId: string,
    lado: "esquerdo" | "direito" | "ambos",
  ) => {
    const existingIndex = selectedAreas.findIndex((a) => a.regiao === regionId);

    if (existingIndex >= 0) {
      // Se já existe e clicou no mesmo lado, remove
      if (selectedAreas[existingIndex].lado === lado) {
        const newAreas = selectedAreas.filter((a) => a.regiao !== regionId);
        onAreasChange(newAreas);
      } else {
        // Atualiza o lado
        const newAreas = [...selectedAreas];
        newAreas[existingIndex] = { regiao: regionId, lado };
        onAreasChange(newAreas);
      }
    } else {
      // Adiciona nova área
      onAreasChange([...selectedAreas, { regiao: regionId, lado }]);
    }
    setExpandedRegion(null);
  };

  const removeRegion = (regionId: string) => {
    const newAreas = selectedAreas.filter((a) => a.regiao !== regionId);
    onAreasChange(newAreas);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione as áreas afetadas</Text>
      <Text style={styles.subtitle}>
        Toque na região e escolha o lado (esquerdo, direito ou ambos)
      </Text>

      {/* Grid de regiões */}
      <View style={styles.grid}>
        {BODY_REGIONS.map((region) => {
          const isSelected = isRegionSelected(region.id);
          const lado = getRegionLado(region.id);
          const isExpanded = expandedRegion === region.id;

          return (
            <View key={region.id} style={styles.regionWrapper}>
              <TouchableOpacity
                style={[
                  styles.regionButton,
                  isSelected && styles.regionButtonSelected,
                ]}
                onPress={() => toggleRegion(region.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={region.icon as any}
                  size={24}
                  color={isSelected ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.regionLabel,
                    isSelected && styles.regionLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {region.label}
                </Text>
                {isSelected && lado && (
                  <Text style={styles.ladoTag}>
                    {lado === "ambos" ? "A" : lado === "esquerdo" ? "E" : "D"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Seletor de lado */}
              {isExpanded && (
                <View style={styles.ladoSelector}>
                  {LADOS.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={[
                        styles.ladoButton,
                        lado === l.id && styles.ladoButtonSelected,
                      ]}
                      onPress={() => selectLado(region.id, l.id as any)}
                    >
                      <Text
                        style={[
                          styles.ladoButtonText,
                          lado === l.id && styles.ladoButtonTextSelected,
                        ]}
                      >
                        {l.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Áreas selecionadas */}
      {selectedAreas.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Áreas selecionadas ({selectedAreas.length}):
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectedList}>
              {selectedAreas.map((area) => {
                const region = BODY_REGIONS.find((r) => r.id === area.regiao);
                return (
                  <View key={area.regiao} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>
                      {region?.label} (
                      {area.lado === "ambos"
                        ? "Ambos"
                        : area.lado === "esquerdo"
                          ? "Esq."
                          : "Dir."}
                      )
                    </Text>
                    <TouchableOpacity onPress={() => removeRegion(area.regiao)}>
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
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
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  regionWrapper: {
    width: "31%",
  },
  regionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    minHeight: 70,
  },
  regionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  regionLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  regionLabelSelected: {
    color: COLORS.white,
  },
  ladoTag: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 16,
    overflow: "hidden",
  },
  ladoSelector: {
    flexDirection: "row",
    marginTop: SPACING.xs,
    gap: 2,
  },
  ladoButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 2,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
  },
  ladoButtonSelected: {
    backgroundColor: COLORS.secondary,
  },
  ladoButtonText: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  ladoButtonTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
  selectedContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  selectedList: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  selectedChipText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
  },
});
