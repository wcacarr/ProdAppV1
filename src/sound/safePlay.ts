type Playable = { play: () => unknown };

/**
 * play() is fire-and-forget on native but returns a promise on web, where a
 * blocked autoplay rejects. Swallow both so audio never takes the app down.
 */
export function safePlay(player: Playable) {
  try {
    const result = player.play();
    if (result && typeof (result as Promise<void>).then === 'function') {
      (result as Promise<void>).catch(() => {});
    }
  } catch {
    // device refused playback
  }
}
