import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, inkAlpha, radii } from '../theme';

type GlassPaneProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tint?: string;
  borderColor?: string;
  intensity?: number;
  radius?: number;
  dark?: boolean;
};

// Reusable "Hyprland glass" pane: BlurView (real backdrop blur) + a
// translucent paper (or ink, for the dark Block pane) wash + hairline
// border + soft drop shadow. Mirrors the backdrop-filter blur panes in
// project/Questlock v2.dc.html.
export default function GlassPane({
  children,
  style,
  contentStyle,
  tint = colors.glassPaper,
  borderColor = inkAlpha(0.18),
  intensity = 40,
  radius = radii.xl,
  dark = false,
}: GlassPaneProps) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, styles.glass, { borderRadius: radius, borderColor }]}>
        <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      </View>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    borderWidth: 1,
  },
});
