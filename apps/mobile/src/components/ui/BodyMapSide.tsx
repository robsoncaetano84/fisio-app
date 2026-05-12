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
  points: BodyMapPointModel[];
  selectedKeys: Set<string>;
  disabled?: boolean;
  editable?: boolean;
  onTogglePoint: (point: BodyMapPointModel) => void;
  onMovePoint?: (point: BodyMapPointModel, xPercent: number, yPercent: number) => void;
}

export function BodyMapSide({
  source,
  imageHalf,
  points,
  selectedKeys,
  disabled = false,
  editable = false,
  onTogglePoint,
  onMovePoint,
}: BodyMapSideProps) {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPanelSize({ width, height });
  };

  return (
    <View
      onLayout={handleLayout}
      style={styles.panel}
      accessibilityRole="image"
      accessibilityLabel="Mapa corporal anatomico"
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={[
          styles.image,
          imageHalf === "left" ? styles.imageLeftHalf : styles.imageRightHalf,
        ]}
      />
      {points.map((point) => (
        <BodyMapPoint
          key={bodyMapPointKey(point)}
          point={point}
          selected={selectedKeys.has(bodyMapPointKey(point))}
          disabled={disabled}
          editable={editable}
          panelSize={panelSize}
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
    flex: 1,
    aspectRatio: BODY_MAP_PANEL_ASPECT_RATIO,
    minWidth: 0,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: BORDER_RADIUS.md,
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
