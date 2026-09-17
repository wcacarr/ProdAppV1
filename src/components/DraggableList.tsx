import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SETTLE = { duration: 180, easing: Easing.out(Easing.cubic) };

type Props<T> = {
  data: T[];
  /** Uniform row height including the gap below it. Rows must not vary. */
  rowHeight: number;
  keyExtractor: (item: T) => string | number;
  onReorder: (from: number, to: number) => void;
  /** Fired when a row lifts, for haptics or a toast. */
  onLiftStart?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
};

/**
 * Press and hold a row to lift it, then drag to move it through the list.
 * Rows are a fixed height so the hovered index is plain arithmetic — no
 * measuring, and nothing to go stale when the list changes underneath.
 */
export default function DraggableList<T>({
  data,
  rowHeight,
  keyExtractor,
  onReorder,
  onLiftStart,
  renderItem,
}: Props<T>) {
  // -1 means nothing is lifted.
  const activeIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  const commit = useCallback(
    (from: number, to: number) => {
      if (from !== to) onReorder(from, to);
    },
    [onReorder]
  );

  return (
    <View style={styles.wrap}>
      {data.map((item, index) => (
        <Row
          key={keyExtractor(item)}
          index={index}
          count={data.length}
          rowHeight={rowHeight}
          activeIndex={activeIndex}
          dragY={dragY}
          onCommit={commit}
          onLiftStart={onLiftStart}
        >
          {renderItem(item, index)}
        </Row>
      ))}
    </View>
  );
}

function Row({
  index,
  count,
  rowHeight,
  activeIndex,
  dragY,
  onCommit,
  onLiftStart,
  children,
}: {
  index: number;
  count: number;
  rowHeight: number;
  activeIndex: ReturnType<typeof useSharedValue<number>>;
  dragY: ReturnType<typeof useSharedValue<number>>;
  onCommit: (from: number, to: number) => void;
  onLiftStart?: () => void;
  children: React.ReactNode;
}) {
  // Long press first, so a quick horizontal flick still reaches the row's own
  // swipe-to-delete gesture instead of starting a drag.
  const drag = Gesture.Pan()
    .activateAfterLongPress(280)
    .maxPointers(1)
    .onStart(() => {
      activeIndex.value = index;
      dragY.value = 0;
      if (onLiftStart) runOnJS(onLiftStart)();
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      const to = targetIndex(index, dragY.value, rowHeight, count);
      runOnJS(onCommit)(index, to);
      // The list re-sorts underneath us, so snap rather than animate back.
      dragY.value = 0;
      activeIndex.value = -1;
    })
    .onFinalize(() => {
      dragY.value = 0;
      activeIndex.value = -1;
    });

  const style = useAnimatedStyle(() => {
    const from = activeIndex.value;
    if (from === -1) {
      return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0, opacity: 1 };
    }

    if (from === index) {
      return {
        transform: [{ translateY: dragY.value }, { scale: 1.03 }],
        zIndex: 20,
        opacity: 0.97,
      };
    }

    // Everything between the row's origin and where it now hovers slides one
    // slot to make the gap.
    const to = targetIndex(from, dragY.value, rowHeight, count);
    let shift = 0;
    if (from < to && index > from && index <= to) shift = -rowHeight;
    else if (from > to && index < from && index >= to) shift = rowHeight;

    return {
      transform: [{ translateY: withTiming(shift, SETTLE) }, { scale: 1 }],
      zIndex: 0,
      opacity: 1,
    };
  });

  return (
    <GestureDetector gesture={drag}>
      <Animated.View style={[{ height: rowHeight }, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

function targetIndex(from: number, translateY: number, rowHeight: number, count: number) {
  'worklet';
  const moved = Math.round(translateY / rowHeight);
  return Math.max(0, Math.min(count - 1, from + moved));
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
});
