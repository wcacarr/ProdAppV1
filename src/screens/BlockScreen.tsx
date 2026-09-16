import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, radii, xpFor } from '../theme';
import { useQuestStore } from '../state/store';
import { offerList } from '../state/data';
import { fastestRemaining } from '../state/selectors';

const paperAlpha = (a: number) => `rgba(253,248,232,${a})`;

export default function BlockScreen() {
  const apps = useQuestStore((s) => s.apps);
  const blockId = useQuestStore((s) => s.blockId);
  const quests = useQuestStore((s) => s.quests);
  const balance = useQuestStore((s) => s.balance);
  const strictMode = useQuestStore((s) => s.strictMode);
  const buy = useQuestStore((s) => s.buy);
  const offers = useMemo(() => offerList(apps), [apps]);
  const closeBlock = useQuestStore((s) => s.closeBlock);
  const startQuest = useQuestStore((s) => s.startQuest);
  const flash = useQuestStore((s) => s.flash);

  const blocked = apps.find((a) => a.id === blockId);
  const blockOffer = blocked ? offers.find((o) => o.appId === blocked.id) : undefined;
  const canAfford = blockOffer ? balance >= blockOffer.cost : false;
  const fastest = fastestRemaining(quests);

  const buyLabel = strictMode
    ? 'Strict mode is on'
    : canAfford && blockOffer
      ? `Unlock for ${blockOffer.cost} XP`
      : `Need ${blockOffer ? blockOffer.cost - balance : 0} more XP`;

  const handleBuy = () => {
    if (strictMode) {
      flash('Strict mode: quests only.');
      return;
    }
    if (blockOffer) buy(blockOffer);
  };

  if (!blocked) return null;

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
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{blocked.initial}</Text>
          </View>
          <View>
            <Text style={styles.title}>{blocked.name} is locked</Text>
            <Text style={styles.desc}>
              {strictMode
                ? 'No buying your way in on strict mode. Finish a quest and it opens on its own.'
                : `You have ${balance} XP. An hour of ${blocked.name} costs ${blockOffer ? blockOffer.cost : 100}.`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={{ gap: 9 }}>
            <Text style={styles.sectionLabel}>FASTEST WAY IN</Text>
            {fastest && (
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
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.buyBtn,
              {
                backgroundColor: !strictMode && canAfford ? colors.ochre : 'transparent',
                borderColor: !strictMode && canAfford ? 'rgba(34,32,27,0.3)' : paperAlpha(0.28),
              },
            ]}
            onPress={handleBuy}
          >
            <Text style={[styles.buyBtnText, { color: !strictMode && canAfford ? colors.ink : paperAlpha(0.6) }]}>
              {buyLabel}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paperAlpha(0.1),
    borderWidth: 1,
    borderColor: paperAlpha(0.22),
  },
  iconText: { fontFamily: fonts.bodyExtra, fontSize: 21, color: colors.paperLight },
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
