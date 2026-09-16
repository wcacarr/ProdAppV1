import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import PressableScale from '../components/PressableScale';
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

  const tiles = useMemo(
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
        {tiles.length === 0 ? (
          <PressableScale style={styles.emptyWrap} onPress={() => setScreen('lock')}>
            <Text style={styles.emptyTitle}>Nothing to buy yet</Text>
            <Text style={styles.emptyBody}>
              Lock an app first and its screen time shows up here. Tap to pick some.
            </Text>
          </PressableScale>
        ) : (
          <View style={styles.grid}>
            {tiles.map(({ offer, icon }) => (
              <OfferTile
                key={`${offer.packageName}-${offer.mins}`}
                offer={offer}
                icon={icon}
                balance={balance}
                onBuy={() => buy(offer)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </GlassPane>
  );
}

function OfferTile({
  offer,
  icon,
  balance,
  onBuy,
}: {
  offer: Offer;
  icon: string;
  balance: number;
  onBuy: () => void;
}) {
  const affordable = balance >= offer.cost;
  return (
    <PressableScale style={styles.tileWrap} onPress={onBuy}>
      <View style={[styles.tile, !affordable && styles.tileDim]}>
        {icon ? (
          <Image source={{ uri: icon }} style={styles.icon} />
        ) : (
          <Text style={styles.fallback}>{offer.label.slice(0, 1).toUpperCase()}</Text>
        )}
      </View>
      <Text style={styles.tileName} numberOfLines={1}>
        {offer.label}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.cost, !affordable && { color: inkAlpha(0.45) }]}>
          {affordable ? `${offer.cost} XP` : `${offer.cost - balance} short`}
        </Text>
        <Text style={styles.duration}>{offer.tierLabel}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 13,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: inkAlpha(0.12),
  },
  title: { fontFamily: fonts.bodyExtra, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.4, color: inkAlpha(0.52), marginTop: 5 },
  balance: { fontFamily: fonts.bodyExtra, fontSize: 18, color: colors.ochreDeep },
  content: { paddingHorizontal: 11, paddingTop: 12, paddingBottom: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  tileWrap: { width: '33.33%', alignItems: 'center', gap: 5, paddingHorizontal: 2 },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(246,239,216,.75)',
    overflow: 'hidden',
  },
  tileDim: { opacity: 0.5 },
  icon: { width: 44, height: 44, borderRadius: 11 },
  fallback: { fontFamily: fonts.bodyExtra, fontSize: 18, color: colors.ink },
  tileName: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.ink, textAlign: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cost: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.ochreDeep },
  duration: { fontFamily: fonts.mono, fontSize: 9, color: inkAlpha(0.5) },

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
