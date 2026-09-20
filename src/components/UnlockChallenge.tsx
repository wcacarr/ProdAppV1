import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fonts, inkAlpha, radii } from '../theme';

const WORDS = [
  'lantern', 'gravel', 'maple', 'current', 'thicket', 'ember', 'harbour', 'quiet',
  'wander', 'thistle', 'marrow', 'lattice', 'cobalt', 'drift', 'kindle', 'meadow',
  'ripple', 'saffron', 'timber', 'vellum', 'willow', 'anchor', 'bramble', 'cinder',
];

const CHALLENGE_SECONDS = 120;

/** Characters that can appear at once and still be someone typing. Swipe input
 *  and autocorrect can land a short word, so this is not set to one. */
const PASTE_JUMP = 6;

function makeSentence() {
  return Array.from({ length: 14 }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');
}

// Friction, not security: the point is to make unlocking cost more attention
// than the impulse has.
export default function UnlockChallenge({
  appLabel,
  onPass,
  onCancel,
}: {
  appLabel: string;
  onPass: () => void;
  onCancel: () => void;
}) {
  const sentence = useMemo(makeSentence, []);
  const [typed, setTyped] = useState('');
  const [pasted, setPasted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGE_SECONDS);
  const failedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          if (!failedRef.current) {
            failedRef.current = true;
            onCancel();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onCancel]);

  const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const matches = normalise(typed) === normalise(sentence);

  /**
   * Typing adds a character at a time. A jump of several at once is a paste —
   * which Google Lens plus the keyboard's clipboard strip made trivial, and
   * which defeats the entire point of the exercise. Hiding the long-press menu
   * does not stop that strip, so the input rejects the jump itself.
   */
  const onType = (next: string) => {
    if (next.length - typed.length > PASTE_JUMP) {
      setPasted(true);
      return;
    }
    if (pasted) setPasted(false);
    setTyped(next);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onCancel} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.outer}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSheet }]} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Unlock {appLabel}?</Text>
            <Text style={styles.subtitle}>
              TYPE THIS EXACTLY · {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} LEFT
            </Text>

            <View style={styles.sentenceBox}>
              <Text style={styles.sentence} selectable={false}>
                {sentence}
              </Text>
            </View>

            <TextInput
              value={typed}
              onChangeText={onType}
              placeholder="Type it here"
              placeholderTextColor={inkAlpha(0.4)}
              multiline
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              // Hiding the long-press menu is not enough on its own: the
              // keyboard's own clipboard strip pastes without it.
              contextMenuHidden
              style={styles.input}
            />
            {pasted && (
              <Text style={styles.pasteWarning}>
                Type it out. Pasting is the bit this is here to stop.
              </Text>
            )}

            <Pressable
              style={[styles.confirmBtn, !matches && styles.confirmBtnOff]}
              onPress={() => matches && onPass()}
            >
              <Text style={[styles.confirmText, !matches && { color: inkAlpha(0.45) }]}>
                {matches ? 'Unlock it' : 'Keep typing'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.payBtn}
              onPress={() => {}}
            >
              <Text style={styles.payText}>Or pay $0.99 — not wired up yet</Text>
            </Pressable>

            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Leave it locked</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  outer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    margin: 8,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: inkAlpha(0.2),
    overflow: 'hidden',
    maxHeight: '88%',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  content: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 18 },
  title: { fontFamily: fonts.bodyExtra, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2, color: inkAlpha(0.55), marginTop: 6 },
  sentenceBox: {
    marginTop: 13,
    padding: 12,
    borderRadius: 13,
    backgroundColor: 'rgba(246,239,216,.8)',
    borderWidth: 1,
    borderColor: inkAlpha(0.14),
  },
  sentence: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 21, color: colors.ink },
  pasteWarning: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#963626',
    marginTop: 8,
  },
  input: {
    marginTop: 10,
    minHeight: 92,
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: inkAlpha(0.18),
    backgroundColor: 'rgba(255,252,242,.85)',
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    marginTop: 13,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: colors.ochre,
    alignItems: 'center',
  },
  confirmBtnOff: { backgroundColor: 'transparent', borderWidth: 1, borderColor: inkAlpha(0.18) },
  confirmText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink },
  payBtn: { marginTop: 10, paddingVertical: 11, alignItems: 'center' },
  payText: { fontFamily: fonts.bodySemi, fontSize: 12, color: inkAlpha(0.45) },
  cancel: { paddingVertical: 9, alignItems: 'center' },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: inkAlpha(0.65) },
});
