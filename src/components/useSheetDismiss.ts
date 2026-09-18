import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SETTLE = { duration: 190, easing: Easing.out(Easing.cubic) };

/** How far down it has to travel before letting go throws it away. */
const DISMISS_PX = 110;

/**
 * Drag-a-sheet-away, shared by every tray in the app so they all behave the
 * same way.
 *
 * Activation is decided by hand rather than by an offset threshold. That lets
 * the gesture take the touch only when it should — a downward drag while the
 * sheet's own list is at the top — and hand it straight back to the scroll view
 * otherwise, instead of swallowing it. Deciding this from React state was the
 * reason an earlier version only worked sometimes: the flag lagged a frame
 * behind the finger, and never updated at all on a sheet too short to scroll.
 *
 * Pass `onScroll` to the sheet's Animated.ScrollView if it has one. Sheets
 * without a scroll view can ignore it; scrollY simply stays at 0.
 */
export function useSheetDismiss(onDismiss: () => void) {
  const dragY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const startY = useSharedValue(0);
  const dismissing = useSharedValue(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const gesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      dismissing.value = false;
      startY.value = e.changedTouches[0].absoluteY;
    })
    .onTouchesMove((e, manager) => {
      const dy = e.changedTouches[0].absoluteY - startY.value;
      if (scrollY.value > 1 || dy < -4) {
        manager.fail();
      } else if (dy > 10) {
        manager.activate();
      }
    })
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_PX || e.velocityY > 900) {
        dismissing.value = true;
        runOnJS(onDismiss)();
      }
    })
    .onFinalize(() => {
      if (!dismissing.value) dragY.value = withTiming(0, SETTLE);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  // The backdrop thins out as the sheet leaves, so the drag feels connected.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - dragY.value / (DISMISS_PX * 2.4)),
  }));

  return { gesture, sheetStyle, backdropStyle, onScroll };
}
