import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassPane from '../components/GlassPane';
import { colors, fonts, inkAlpha, radii } from '../theme';
import { useQuestStore } from '../state/store';
import { TILE_BG, offerList } from '../state/data';
import { Offer } from '../state/types';

export default function StoreScreen() {
  const balance = useQuestStore((s) => s.balance);
  const apps = useQuestStore((s) => s.apps);
  const buy = useQuestStore((s) => s.buy);
  const offers = useMemo(() => offerList(apps), [apps]);

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
        {offers.map((o, i) => (
          <OfferRow
            key={`${o.appId}-${i}`}
            offer={o}
            initial={apps.find((a) => a.id === o.appId)?.initial ?? '?'}
            balance={balance}
            onBuy={() => buy(o)}
          />
        ))}
        <Text style={styles.footnote}>Unlocks start the moment you buy them. Nothing carries to tomorrow.</Text>
      </ScrollView>
    </GlassPane>
  );
}

function OfferRow({
  offer,
  initial,
  balance,
  onBuy,
}: {
  offer: Offer;
  initial: string;
  balance: number;
  onBuy: () => void;
}) {
  const ok = balance >= offer.cost;
  return (
    <View style={[styles.row, { opacity: ok ? 1 : 0.62 }]}>
      <View style={[styles.tile, { backgroundColor: TILE_BG[offer.appId] ?? 'rgba(246,239,216,.8)' }]}>
        <Text style={styles.tileInitial}>{initial}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.offerTitle}>{offer.title}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
  },
  tileInitial: { fontFamily: fonts.bodyExtra, fontSize: 15, color: colors.ink },
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
  footnote: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: inkAlpha(0.5), textAlign: 'center', marginTop: 4 },
});
