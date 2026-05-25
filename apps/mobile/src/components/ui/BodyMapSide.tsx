import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import {
  BodyMapPoint as BodyMapPointModel,
  BODY_MAP_PANEL_ASPECT_RATIO,
  BodySex,
  BodyView,
  bodyMapPointKey,
} from "./body-map-points.config";
import { BodyMapPoint } from "./BodyMapPoint";

type ImageHalf = "left" | "right";

interface BodyMapSideProps {
  sex: BodySex;
  view: BodyView;
  source: ImageSourcePropType;
  imageHalf: ImageHalf;
  panelWidth?: number;
  points: BodyMapPointModel[];
  selectedKeys: Set<string>;
  disabled?: boolean;
  editable?: boolean;
  compact?: boolean;
  onTogglePoint: (point: BodyMapPointModel) => void;
  onMovePoint?: (
    point: BodyMapPointModel,
    xPercent: number,
    yPercent: number,
  ) => void;
}

export function BodyMapSide({
  source,
  imageHalf,
  panelWidth,
  points,
  selectedKeys,
  disabled = false,
  editable = false,
  compact = false,
  onTogglePoint,
  onMovePoint,
}: BodyMapSideProps) {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const hasMeasuredPanelWidth =
    typeof panelWidth === "number" &&
    Number.isFinite(panelWidth) &&
    panelWidth > 0;
  const effectivePanelWidth = hasMeasuredPanelWidth
    ? panelWidth
    : panelSize.width;
  const effectivePanelHeight = hasMeasuredPanelWidth
    ? panelWidth / BODY_MAP_PANEL_ASPECT_RATIO
    : panelSize.height;
  const hasRenderablePanel = effectivePanelWidth > 0 && effectivePanelHeight > 0;
  const pointSizeScale = compact && effectivePanelWidth < 360 ? 0.9 : 1;
  const explicitPanelSize = hasMeasuredPanelWidth
    ? {
        width: panelWidth,
        height: panelWidth / BODY_MAP_PANEL_ASPECT_RATIO,
      }
    : null;
  const renderedPanelSize = hasRenderablePanel
    ? { width: effectivePanelWidth, height: effectivePanelHeight }
    : panelSize;
  const measuredImageStyle = hasRenderablePanel
    ? {
        width: effectivePanelWidth * 2,
        height: effectivePanelHeight,
        left: imageHalf === "left" ? 0 : -effectivePanelWidth,
      }
    : null;
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPanelSize({ width, height });
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.panel,
        hasMeasuredPanelWidth ? styles.panelFixed : styles.panelFluid,
        compact && styles.panelCompact,
        explicitPanelSize,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Mapa corporal anatomico"
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={[
          styles.image,
          measuredImageStyle ||
            (imageHalf === "left"
              ? styles.imageLeftHalf
              : styles.imageRightHalf),
        ]}
      />
      {points.map((point) => (
        <BodyMapPoint
          key={bodyMapPointKey(point)}
          point={point}
          selected={selectedKeys.has(bodyMapPointKey(point))}
          disabled={disabled}
          editable={editable}
          sizeScale={pointSizeScale}
          panelSize={renderedPanelSize}
          onToggle={onTogglePoint}
          onMove={onMovePoint}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "relative",
    aspectRatio: BODY_MAP_PANEL_ASPECT_RATIO,
    minWidth: 0,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
  },
  panelFluid: {
    flex: 1,
  },
  panelFixed: {
    flexGrow: 0,
    flexShrink: 0,
  },
  panelCompact: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    flexGrow: 0,
    flexShrink: 0,
  },
  image: {
    position: "absolute",
    top: 0,
    width: "200%",
    height: "100%",
  },
  imageLeftHalf: {
    left: 0,
  },
  imageRightHalf: {
    left: "-100%",
  },
});
