import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { fastestRemaining } from '../state/selectors';
import { UNLOCK_TIERS } from '../state/data';
import { useAppRegistry } from '../state/useAppRegistry';

const paperAlpha = (a: number) => `rgba(253,248,232,${a})`;

export default function BlockScreen() {
  const blockPackage = useQuestStore((s) => s.blockPackage);
  const quests = useQuestStore((s) => s.quests);
  const balance = useQuestStore((s) => s.balance);
  const buy = useQuestStore((s) => s.buy);
  const closeBlock = useQuestStore((s) => s.closeBlock);
  const startQuest = useQuestStore((s) => s.startQuest);
  const { entries } = useAppRegistry();

  const blocked = entries.find((e) => e.packageName === blockPackage);
  const label = blocked?.label ?? 'This app';
  const cheapest = UNLOCK_TIERS[0];
  const canAfford = balance >= cheapest.cost;
  const fastest = fastestRemaining(quests);

  if (!blockPackage) return null;

  return (
    <GlassPane
      radius={radii.xl}
      intensity={30}
      dark
      tint={colors.blockBg}
      borderColor={colors.blockBorder}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={{ flex: 1, minHeight: 0 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.body}>
          {blocked?.icon ? (
            <Image source={{ uri: blocked.icon }} style={styles.iconBox} />
          ) : (
            <View style={styles.iconBox} />
          )}
          <View>
            <Text style={styles.title}>{label} is locked</Text>
            <Text style={styles.desc}>
              You have {balance} XP. {cheapest.label} of {label} costs {cheapest.cost}.
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={{ gap: 9 }}>
            <Text style={styles.sectionLabel}>FASTEST WAY IN</Text>
            {fastest ? (
              <Pressable style={styles.questRow} onPress={() => startQuest(fastest.id)}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.questName}>{fastest.name}</Text>
                  <Text style={styles.questMeta}>
                    {fastest.mins} MIN · +{xpFor(fastest.mins)} XP
                  </Text>
                </View>
                <View style={styles.startPill}>
                  <Text style={styles.startPillText}>Start</Text>
                </View>
              </Pressable>
            ) : (
              <Text style={styles.questMeta}>Nothing left on today's list.</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.buyBtn,
              {
                backgroundColor: canAfford ? colors.ochre : 'transparent',
                borderColor: canAfford ? 'rgba(34,32,27,0.3)' : paperAlpha(0.28),
              },
            ]}
            onPress={() =>
              buy({
                packageName: blockPackage,
                label,
                tierLabel: cheapest.label,
                mins: cheapest.mins,
                cost: cheapest.cost,
              })
            }
          >
            <Text style={[styles.buyBtnText, { color: canAfford ? colors.ink : paperAlpha(0.6) }]}>
              {canAfford
                ? `Unlock ${cheapest.label} for ${cheapest.cost} XP`
                : `Need ${cheapest.cost - balance} more XP`}
            </Text>
          </Pressable>
          <Pressable style={styles.notNow} onPress={closeBlock}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </GlassPane>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 22, paddingHorizontal: 20 },
  body: { flex: 1, justifyContent: 'center', gap: 15 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: paperAlpha(0.1),
    borderWidth: 1,
    borderColor: paperAlpha(0.22),
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 24, color: colors.paperLight },
  desc: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: paperAlpha(0.68), marginTop: 9, maxWidth: 280 },
  divider: { height: 1, backgroundColor: paperAlpha(0.14) },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.5, color: paperAlpha(0.5) },
  questRow: {
    padding: 12,
    paddingHorizontal: 13,
    borderRadius: radii.md,
    backgroundColor: paperAlpha(0.08),
    borderWidth: 1,
    borderColor: paperAlpha(0.2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  questName: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.paperLight },
  questMeta: { fontFamily: fonts.mono, fontSize: 10, color: paperAlpha(0.6), marginTop: 3 },
  startPill: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.ochre },
  startPillText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  actions: { marginTop: 14, gap: 8 },
  buyBtn: { paddingVertical: 13, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
  buyBtnText: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  notNow: { paddingVertical: 11, alignItems: 'center' },
  notNowText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: paperAlpha(0.55) },
});
