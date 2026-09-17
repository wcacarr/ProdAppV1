import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import GlassPane from './GlassPane';
import PressableScale from './PressableScale';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { Screen } from '../state/types';

const TABS: { key: Screen; label: string; num: string }[] = [
  { key: 'today', label: 'Today', num: '1' },
  { key: 'store', label: 'Store', num: '2' },
  { key: 'apps', label: 'Apps', num: '3' },
  { key: 'lock', label: 'Lock', num: '4' },
];

export default function TopTabBar() {
  const screen = useQuestStore((s) => s.screen);
  const setScreen = useQuestStore((s) => s.setScreen);

  return (
    <GlassPane radius={radii.lg} intensity={30} contentStyle={styles.row}>
      {TABS.map((t) => {
        const on = screen === t.key;
        return (
          <PressableScale
            key={t.key}
            onPress={() => setScreen(t.key)}
            style={[
              styles.tab,
              {
                backgroundColor: on ? colors.ochre : 'rgba(246,239,216,.5)',
                borderColor: on ? inkAlpha(0.28) : inkAlpha(0.12),
              },
            ]}
          >
            <Text style={[styles.num, { color: on ? inkAlpha(0.6) : inkAlpha(0.4) }]}>{t.num}</Text>
            <Text style={[styles.label, { color: on ? colors.ink : inkAlpha(0.55) }]}>{t.label}</Text>
          </PressableScale>
        );
      })}
      <PressableScale
        onPress={() => setScreen('settings')}
        style={[
          styles.gear,
          {
            backgroundColor: screen === 'settings' ? colors.ochre : 'rgba(246,239,216,.5)',
            borderColor: screen === 'settings' ? inkAlpha(0.28) : inkAlpha(0.12),
          },
        ]}
      >
        <GearIcon />
      </PressableScale>
    </GlassPane>
  );
}

function GearIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3.2} fill="none" stroke={colors.ink} strokeWidth={1.7} />
      <Path
        d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4"
        stroke={colors.ink}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  gear: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  num: { fontFamily: fonts.bodyMedium, fontSize: 9 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
