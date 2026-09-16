import React, { useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Polygon, Polyline, Rect } from 'react-native-svg';
import PressableScale from './PressableScale';
import { colors, fonts, inkAlpha, mmss, radii } from '../theme';
import { useNowPlaying } from '../media/useNowPlaying';
import { useQuestStore } from '../state/store';

/** Leaves the XP/rank pane visible above the panel. */
const PANEL_FRACTION = 0.68;

export default function ExpandedPlayer() {
  const { height } = useWindowDimensions();
  const close = useQuestStore((s) => s.setPlayerExpanded);
  const { now, liveProgressMs, togglePlay, next, previous, seekTo } = useNowPlaying(1000);

  const [barWidth, setBarWidth] = useState(0);
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const dragY = useSharedValue(0);

  const duration = now?.durationMs ?? 0;
  const playedFraction = duration ? Math.min(1, liveProgressMs / duration) : 0;
  const shownFraction = scrubFraction ?? playedFraction;

  const dismiss = Gesture.Pan()
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 90 || e.velocityY > 800) {
        runOnJS(close)(false);
      } else {
        dragY.value = withSpring(0, { damping: 22, stiffness: 220 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  // Scrub against the measured bar so the thumb tracks the finger exactly.
  const scrub = Gesture.Pan()
    .onBegin((e) => {
      if (barWidth > 0) runOnJS(setScrubFraction)(clamp(e.x / barWidth));
    })
    .onUpdate((e) => {
      if (barWidth > 0) runOnJS(setScrubFraction)(clamp(e.x / barWidth));
    })
    .onEnd((e) => {
      if (barWidth > 0 && duration > 0) {
        runOnJS(seekTo)(clamp(e.x / barWidth) * duration);
      }
      runOnJS(setScrubFraction)(null);
    });

  const remainingMs = Math.max(0, duration - shownFraction * duration);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={48} tint="light" style={StyleSheet.absoluteFill} />
        <PressableScale style={StyleSheet.absoluteFill} scaleTo={1} onPress={() => close(false)} />
      </Animated.View>

      <GestureDetector gesture={dismiss}>
        <Animated.View
          entering={SlideInDown.springify().damping(24).stiffness(180)}
          exiting={SlideOutDown.duration(220)}
          style={[styles.panelWrap, { height: height * PANEL_FRACTION }, panelStyle]}
        >
          <View style={styles.panel}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(253,248,232,0.86)' }]} />

            <View style={styles.content}>
              <View style={styles.handle} />

              <View style={styles.artWrap}>
                {now?.albumArtUrl ? (
                  <Image source={{ uri: now.albumArtUrl }} style={styles.art} />
                ) : (
                  <View style={styles.art}>
                    <MiniScene />
                  </View>
                )}
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {now?.trackName || 'Nothing playing'}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {now?.artistName || 'Play something in any music app'}
              </Text>

              <GestureDetector gesture={scrub}>
                <View style={styles.barHit} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${shownFraction * 100}%` }]} />
                  </View>
                  <View style={[styles.thumb, { left: Math.max(0, shownFraction * barWidth - 9) }]} />
                </View>
              </GestureDetector>

              <View style={styles.timesRow}>
                <Text style={styles.time}>{mmss((shownFraction * duration) / 1000)}</Text>
                <Text style={styles.timeRemaining}>{formatRemaining(remainingMs)}</Text>
                <Text style={styles.time}>-{mmss(remainingMs / 1000)}</Text>
              </View>

              <View style={styles.transport}>
                <PressableScale style={styles.sideBtn} onPress={previous}>
                  <Svg width={18} height={18} viewBox="0 0 16 16">
                    <Polygon points="14,2 6,8 14,14" fill={colors.ink} />
                    <Rect x={3} y={2} width={2} height={12} fill={colors.ink} />
                  </Svg>
                </PressableScale>

                <PressableScale style={styles.playBtn} onPress={togglePlay}>
                  {now?.isPlaying ? (
                    <Svg width={22} height={22} viewBox="0 0 16 16">
                      <Rect x={3} y={2} width={4} height={12} fill={colors.ink} />
                      <Rect x={10} y={2} width={4} height={12} fill={colors.ink} />
                    </Svg>
                  ) : (
                    <Svg width={24} height={24} viewBox="0 0 16 16">
                      <Polygon points="3,2 14,8 3,14" fill={colors.ink} />
                    </Svg>
                  )}
                </PressableScale>

                <PressableScale style={styles.sideBtn} onPress={next}>
                  <Svg width={18} height={18} viewBox="0 0 16 16">
                    <Polygon points="2,2 10,8 2,14" fill={colors.ink} />
                    <Rect x={11} y={2} width={2} height={12} fill={colors.ink} />
                  </Svg>
                </PressableScale>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function clamp(v: number) {
  'worklet';
  return Math.max(0, Math.min(1, v));
}

function formatRemaining(ms: number) {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m left`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m left`;
}

function MiniScene() {
  return (
    <Svg viewBox="0 0 44 44" style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={44} height={44} fill={colors.paperCard} />
      <Circle cx={30} cy={15} r={10} fill={colors.ochre} />
      <G fill="none" stroke={colors.ink} strokeOpacity={0.45} strokeWidth={0.8}>
        <Ellipse cx={22} cy={36} rx={10} ry={3} />
        <Ellipse cx={22} cy={36} rx={20} ry={6} />
        <Polyline points="2,28 12,20 20,27 30,18 42,29" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  panelWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  panel: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 18, alignItems: 'center' },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: inkAlpha(0.22),
    marginBottom: 16,
  },
  artWrap: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  art: {
    width: 190,
    height: 190,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: colors.paperCard,
  },
  title: {
    fontFamily: fonts.bodyExtra,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 20,
  },
  artist: { fontFamily: fonts.mono, fontSize: 11, color: inkAlpha(0.55), marginTop: 7, textAlign: 'center' },

  barHit: { width: '100%', height: 34, justifyContent: 'center', marginTop: 22 },
  barTrack: { height: 5, borderRadius: 999, backgroundColor: inkAlpha(0.15), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: colors.ochre },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ochre,
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
  },
  timesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  time: { fontFamily: fonts.mono, fontSize: 10.5, color: inkAlpha(0.55), fontVariant: ['tabular-nums'] },
  timeRemaining: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: inkAlpha(0.6) },

  transport: { flexDirection: 'row', alignItems: 'center', gap: 26, marginTop: 'auto' },
  sideBtn: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ochre,
    borderWidth: 1,
    borderColor: inkAlpha(0.22),
  },
});
