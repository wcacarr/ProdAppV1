package expo.modules.questlockblocker

import android.content.Context

// The accessibility service must decide whether to block in milliseconds, with
// no JS running, so the lock rules live here in native storage. The RN UI
// writes to this; it is not a mirror of a JS store.
object BlockStore {
  private const val PREFS = "questlock_blocker"
  private const val KEY_BLOCKED = "blocked_packages"
  private const val KEY_UNLOCK_PREFIX = "unlock_until_"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun getBlocked(context: Context): Set<String> =
    prefs(context).getStringSet(KEY_BLOCKED, emptySet())?.toSet() ?: emptySet()

  fun setBlocked(context: Context, packages: List<String>) {
    prefs(context).edit().putStringSet(KEY_BLOCKED, packages.toSet()).apply()
  }

  fun getUnlockUntil(context: Context, packageName: String): Long =
    prefs(context).getLong(KEY_UNLOCK_PREFIX + packageName, 0L)

  fun grantUnlock(context: Context, packageName: String, minutes: Int) {
    val until = System.currentTimeMillis() + minutes * 60_000L
    prefs(context).edit().putLong(KEY_UNLOCK_PREFIX + packageName, until).apply()
  }

  fun clearUnlock(context: Context, packageName: String) {
    prefs(context).edit().remove(KEY_UNLOCK_PREFIX + packageName).apply()
  }

  fun isBlockedNow(context: Context, packageName: String): Boolean {
    if (!getBlocked(context).contains(packageName)) return false
    return System.currentTimeMillis() >= getUnlockUntil(context, packageName)
  }
}
