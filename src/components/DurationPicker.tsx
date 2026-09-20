import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, durationLabel, fonts, inkAlpha, radii } from '../theme';
import { DURATION_CHOICES } from '../state/data';

/** Two minutes is a real task; so is forty-five seconds. */
const MAX_MINUTES = 240;

export default function DurationPicker({
  mins,
  onChange,
}: {
  mins: number;
  onChange: (mins: number) => void;
}) {
  const isPreset = DURATION_CHOICES.includes(mins);
  const [custom, setCustom] = useState(!isPreset);
  // Held as text while being typed so a half-finished number does not get
  // rounded away under the user.
  const [minText, setMinText] = useState(String(Math.floor(mins)));
  const [secText, setSecText] = useState(String(Math.round((mins % 1) * 60)));

  const commit = (m: string, sec: string) => {
    const whole = Math.max(0, Math.min(MAX_MINUTES, parseInt(m || '0', 10) || 0));
    const seconds = Math.max(0, Math.min(59, parseInt(sec || '0', 10) || 0));
    const total = whole + seconds / 60;
    // Refuse to land on zero; the shortest useful quest is fifteen seconds.
    onChange(total > 0 ? total : 0.25);
  };

  return (
    <View>
      <View style={styles.row}>
        {DURATION_CHOICES.map((m) => {
          const on = !custom && mins === m;
          return (
            <Pressable
              key={m}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => {
                setCustom(false);
                onChange(m);
              }}
            >
              <Text style={styles.chipText}>{m}m</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, styles.chipWide, custom && styles.chipOn]}
          onPress={() => {
            setCustom(true);
            commit(minText, secText);
          }}
        >
          <Text style={styles.chipText}>Custom</Text>
        </Pressable>
      </View>

      {custom && (
        <View style={styles.customRow}>
          <Field
            value={minText}
            onChangeText={(t) => {
              setMinText(t);
              commit(t, secText);
            }}
            unit="min"
          />
          <Field
            value={secText}
            onChangeText={(t) => {
              setSecText(t);
              commit(minText, t);
            }}
            unit="sec"
          />
          <Text style={styles.readout}>{durationLabel(mins)}</Text>
        </View>
      )}
    </View>
  );
}

function Field({
  value,
  onChangeText,
  unit,
}: {
  value: string;
  onChangeText: (t: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.field}>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, '').slice(0, 3))}
        keyboardType="number-pad"
        selectTextOnFocus
        style={styles.fieldInput}
        placeholder="0"
        placeholderTextColor={inkAlpha(0.35)}
      />
      <Text style={styles.fieldUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  chip: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 52,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkAlpha(0.16),
    backgroundColor: 'rgba(255,252,242,.8)',
  },
  chipWide: { flexBasis: '100%', flexGrow: 0 },
  chipOn: { backgroundColor: colors.ochre, borderColor: 'rgba(34,32,27,0.3)' },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  field: {
    // Equal halves, so the minutes box cannot swallow the seconds one.
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
    backgroundColor: 'rgba(255,252,242,.85)',
  },
  fieldInput: {
    width: 40,
    paddingVertical: 0,
    fontFamily: fonts.bodyExtra,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  fieldUnit: { fontFamily: fonts.mono, fontSize: 9.5, color: inkAlpha(0.5) },
  readout: { width: 62, fontFamily: fonts.mono, fontSize: 10, color: inkAlpha(0.5), textAlign: 'right' },
});
