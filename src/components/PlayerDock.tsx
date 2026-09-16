import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon, Polyline, Rect } from 'react-native-svg';
import GlassPane from './GlassPane';
import { colors, fonts, inkAlpha, mmss, radii } from '../theme';
import { useNowPlaying } from '../media/useNowPlaying';
import { openNotificationAccessSettings } from '../../modules/questlock-blocker';

export default function PlayerDock() {
  const { now, status, liveProgressMs, togglePlay, next, previous } = useNowPlaying();

  const sourceLabel =
    status === 'active'
      ? 'DEVICE MEDIA'
      : status === 'needs_permission'
        ? 'TAP TO CONNECT MEDIA'
        : status === 'unsupported'
          ? 'MEDIA NEEDS A DEV BUILD'
          : 'NOTHING PLAYING';

  const idleTitle = status === 'needs_permission' ? 'Connect media controls' : 'Nothing playing';
  const idleSubtitle =
    status === 'needs_permission'
      ? 'Allow notification access to see Audible'
      : 'Play something in any music app';

  const trackPct = now && now.durationMs ? Math.min(1, liveProgressMs / now.durationMs) : 0;

  return (
    <GlassPane radius={18} intensity={36} contentStyle={styles.pad}>
      <View style={styles.row}>
        <View style={styles.art}>
          {now?.albumArtUrl ? (
            <Image source={{ uri: now.albumArtUrl }} style={StyleSheet.absoluteFill} />
          ) : (
            <MiniScene />
          )}
        </View>
        <Pressable
          style={{ flex: 1, minWidth: 0 }}
          onPress={() => status === 'needs_permission' && openNotificationAccessSettings()}
        >
          <View style={styles.sourceRow}>
            <View style={styles.dot} />
            <Text style={styles.sourceText} numberOfLines={1}>
              {sourceLabel}
            </Text>
          </View>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {now?.trackName || idleTitle}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {now?.artistName || idleSubtitle}
          </Text>
        </Pressable>
        <View style={[styles.controls, !now && styles.controlsIdle]}>
          <Pressable style={styles.smallBtn} onPress={previous}>
            <Svg width={13} height={13} viewBox="0 0 16 16">
              <Polygon points="14,2 6,8 14,14" fill={colors.ink} />
              <Rect x={3} y={2} width={2} height={12} fill={colors.ink} />
            </Svg>
          </Pressable>
          <Pressable style={styles.playBtn} onPress={togglePlay}>
            {now?.isPlaying ? (
              <Svg width={14} height={14} viewBox="0 0 16 16">
                <Rect x={3} y={2} width={4} height={12} fill={colors.ink} />
                <Rect x={10} y={2} width={4} height={12} fill={colors.ink} />
              </Svg>
            ) : (
              <Svg width={15} height={15} viewBox="0 0 16 16">
                <Polygon points="3,2 14,8 3,14" fill={colors.ink} />
              </Svg>
            )}
          </Pressable>
          <Pressable style={styles.smallBtn} onPress={next}>
            <Svg width={13} height={13} viewBox="0 0 16 16">
              <Polygon points="2,2 10,8 2,14" fill={colors.ink} />
              <Rect x={11} y={2} width={2} height={12} fill={colors.ink} />
            </Svg>
          </Pressable>
        </View>
      </View>

      {now && (
        <View style={styles.progressRow}>
          <Text style={styles.time}>{mmss(liveProgressMs / 1000)}</Text>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${trackPct * 100}%` }]} />
          </View>
          <Text style={styles.time}>{mmss(now.durationMs / 1000)}</Text>
        </View>
      )}
    </GlassPane>
  );
}

function MiniScene() {
  return (
    <Svg viewBox="0 0 44 44" style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={44} height={44} fill={colors.paperCard} />
      <Circle cx={30} cy={15} r={10} fill={colors.ochre} />
      <G fill="none" stroke={colors.ink} strokeOpacity={0.45} strokeWidth={0.8}>
        <Ellipse cx={22} cy={36} rx={10} ry={3} />
        <Ellipse cx={22} cy={36} rx={20} ry={6} />
        <Ellipse cx={22} cy={36} rx={30} ry={9} />
        <Polyline points="2,28 12,20 20,27 30,18 42,29" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  art: {
    width: 44,
    height: 44,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    backgroundColor: colors.paperCard,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.ochreDeep },
  sourceText: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 1, color: inkAlpha(0.55) },
  trackTitle: { fontFamily: fonts.bodyBold, fontSize: 13, marginTop: 5, color: colors.ink },
  trackArtist: { fontFamily: fonts.mono, fontSize: 10, marginTop: 3, color: inkAlpha(0.55) },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  controlsIdle: { opacity: 0.45 },
  smallBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(246,239,216,.6)',
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.25),
    backgroundColor: colors.ochre,
  },
  connectBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.ochre },
  connectBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  time: { fontFamily: fonts.mono, fontSize: 9, color: inkAlpha(0.5), fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: 3, borderRadius: 999, backgroundColor: inkAlpha(0.14), overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 999, backgroundColor: colors.ochreDeep },
});
