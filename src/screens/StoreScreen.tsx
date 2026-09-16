import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { UNLOCK_TIERS } from '../state/data';
import { useAppRegistry } from '../state/useAppRegistry';
import { Offer } from '../state/types';

export default function StoreScreen() {
  const balance = useQuestStore((s) => s.balance);
  const buy = useQuestStore((s) => s.buy);
  const setScreen = useQuestStore((s) => s.setScreen);
  const { lockedApps } = useAppRegistry();

  const rows = useMemo(
    () =>
      lockedApps.flatMap((app) =>
        UNLOCK_TIERS.map((tier) => ({
          icon: app.icon,
          offer: {
            packageName: app.packageName,
            label: app.label,
            tierLabel: tier.label,
            mins: tier.mins,
            cost: tier.cost,
          } as Offer,
        }))
      ),
    [lockedApps]
  );

  return (
    <GlassPane
      radius={radii.xl}
      intensity={35}
      tint={colors.glassPaperList}
      style={{ flex: 1, minHeight: 0 }}
      contentStyle={{ flex: 1, minHeight: 0 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Store</Text>
          <Text style={styles.subtitle}>TRADE XP FOR SCREEN TIME</Text>
        </View>
        <Text style={styles.balance}>{balance} XP</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.length === 0 ? (
          <Pressable style={styles.emptyWrap} onPress={() => setScreen('lock')}>
            <Text style={styles.emptyTitle}>Nothing to buy yet</Text>
            <Text style={styles.emptyBody}>
              Lock an app first and its screen time shows up here. Tap to pick some.
            </Text>
          </Pressable>
        ) : (
          rows.map(({ offer, icon }) => (
            <OfferRow
              key={`${offer.packageName}-${offer.mins}`}
              offer={offer}
              icon={icon}
              balance={balance}
              onBuy={() => buy(offer)}
            />
          ))
        )}
        {rows.length > 0 && (
          <Text style={styles.footnote}>
            Unlocks start the moment you buy them. Nothing carries to tomorrow.
          </Text>
        )}
      </ScrollView>
    </GlassPane>
  );
}

function OfferRow({
  offer,
  icon,
  balance,
  onBuy,
}: {
  offer: Offer;
  icon: string | null;
  balance: number;
  onBuy: () => void;
}) {
  const ok = balance >= offer.cost;
  return (
    <View style={[styles.row, { opacity: ok ? 1 : 0.62 }]}>
      {icon ? <Image source={{ uri: icon }} style={styles.tile} /> : <View style={styles.tile} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.offerTitle} numberOfLines={1}>
          {offer.label} — {offer.tierLabel}
        </Text>
        <Text style={styles.offerSub}>{offer.cost} XP</Text>
      </View>
      <Pressable
        onPress={onBuy}
        style={[
          styles.buyBtn,
          {
            backgroundColor: ok ? colors.ochre : 'transparent',
            borderColor: ok ? inkAlpha(0.25) : inkAlpha(0.18),
          },
        ]}
      >
        <Text style={[styles.buyBtnText, { color: ok ? colors.ink : inkAlpha(0.5) }]} numberOfLines={1}>
          {ok ? `${offer.cost} XP` : `${offer.cost - balance} short`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.5, color: inkAlpha(0.52), marginTop: 6 },
  balance: { fontFamily: fonts.bodyExtra, fontSize: 19, color: colors.ochreDeep },
  content: { padding: 13, paddingTop: 11, gap: 8 },

  row: {
    padding: 11,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: inkAlpha(0.13),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  tile: {
    width: 37,
    height: 37,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
    backgroundColor: 'rgba(246,239,216,.8)',
  },
  offerTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  offerSub: { fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.52), marginTop: 3 },
  buyBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  buyBtnText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: inkAlpha(0.5),
    textAlign: 'center',
    marginTop: 4,
  },
  emptyWrap: { paddingVertical: 28, paddingHorizontal: 10, alignItems: 'center', gap: 8 },
  emptyTitle: { fontFamily: fonts.bodyExtra, fontSize: 15, color: colors.ink },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: inkAlpha(0.6),
    textAlign: 'center',
    maxWidth: 240,
  },
});
