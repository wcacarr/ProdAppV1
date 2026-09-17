package expo.modules.questlockblocker

import android.content.Context
import java.util.Calendar

// The accessibility service must decide whether to block in milliseconds, with
// no JS running, so the lock rules live here in native storage. The RN UI
// writes to this; it is not a mirror of a JS store.
object BlockStore {
  private const val PREFS = "questlock_blocker"
  private const val KEY_BLOCKED = "blocked_packages"
  private const val KEY_UNLOCK_PREFIX = "unlock_until_"
  private const val KEY_COMMIT_PREFIX = "lock_active_at_"
  private const val KEY_BEDTIME_ON = "bedtime_enabled"
  private const val KEY_BEDTIME_START = "bedtime_start_min"
  private const val KEY_BEDTIME_WAKE = "bedtime_wake_min"

  /** Grace window after ticking an app, during which it can still be unticked freely. */
  const val GRACE_MS = 60_000L

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun getBlocked(context: Context): Set<String> =
    prefs(context).getStringSet(KEY_BLOCKED, emptySet())?.toSet() ?: emptySet()

  fun lock(context: Context, packageName: String) {
    val next = getBlocked(context).toMutableSet().apply { add(packageName) }
    prefs(context).edit()
      .putStringSet(KEY_BLOCKED, next)
      .putLong(KEY_COMMIT_PREFIX + packageName, System.currentTimeMillis() + GRACE_MS)
      .apply()
  }

  fun unlock(context: Context, packageName: String) {
    val next = getBlocked(context).toMutableSet().apply { remove(packageName) }
    prefs(context).edit()
      .putStringSet(KEY_BLOCKED, next)
      .remove(KEY_COMMIT_PREFIX + packageName)
      .remove(KEY_UNLOCK_PREFIX + packageName)
      .apply()
  }

  /** When the lock stops being reversible without a challenge. */
  fun getLockActiveAt(context: Context, packageName: String): Long =
    prefs(context).getLong(KEY_COMMIT_PREFIX + packageName, 0L)

  fun getUnlockUntil(context: Context, packageName: String): Long =
    prefs(context).getLong(KEY_UNLOCK_PREFIX + packageName, 0L)

  fun grantUnlock(context: Context, packageName: String, minutes: Int) {
    val until = System.currentTimeMillis() + minutes * 60_000L
    prefs(context).edit().putLong(KEY_UNLOCK_PREFIX + packageName, until).apply()
  }

  fun setBedtime(context: Context, enabled: Boolean, startMin: Int, wakeMin: Int) {
    prefs(context).edit()
      .putBoolean(KEY_BEDTIME_ON, enabled)
      .putInt(KEY_BEDTIME_START, startMin)
      .putInt(KEY_BEDTIME_WAKE, wakeMin)
      .apply()
  }

  fun isBedtimeEnabled(context: Context): Boolean =
    prefs(context).getBoolean(KEY_BEDTIME_ON, false)

  fun getBedtimeStart(context: Context): Int =
    prefs(context).getInt(KEY_BEDTIME_START, 22 * 60)

  fun getBedtimeWake(context: Context): Int =
    prefs(context).getInt(KEY_BEDTIME_WAKE, 7 * 60)

  /** Bedtime normally wraps past midnight, so "inside it" is two ranges. */
  fun isBedtimeNow(context: Context): Boolean {
    if (!isBedtimeEnabled(context)) return false
    val start = getBedtimeStart(context)
    val wake = getBedtimeWake(context)
    if (start == wake) return false
    val calendar = Calendar.getInstance()
    val nowMin = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    return if (start < wake) {
      nowMin >= start && nowMin < wake
    } else {
      nowMin >= start || nowMin < wake
    }
  }

  fun isBlockedNow(context: Context, packageName: String): Boolean {
    if (!getBlocked(context).contains(packageName)) return false
    val now = System.currentTimeMillis()
    // The grace window still wins: it is about undoing a lock you just set,
    // not about screen time.
    if (now < getLockActiveAt(context, packageName)) return false
    // Overnight, bought time counts for nothing.
    if (isBedtimeNow(context)) return true
    return now >= getUnlockUntil(context, packageName)
  }
}
