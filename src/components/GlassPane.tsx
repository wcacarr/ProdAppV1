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
// border + soft drop shadow.
//
// Three layers on purpose: the shadow can't live on a clipping view (iOS
// clips it away), and content has to be inside the clip or card corners
// bleed past the pane's radius. flexBasis:'auto' with grow+shrink lets the
// clip fill a flexed parent without collapsing inside an auto-height one.
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
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 14,
          elevation: 6,
        },
        style,
      ]}
    >
      <View style={[styles.clip, { borderRadius: radius, borderColor }]}>
        <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
});
