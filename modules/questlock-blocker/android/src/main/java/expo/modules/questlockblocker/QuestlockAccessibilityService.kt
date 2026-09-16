package expo.modules.questlockblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.view.accessibility.AccessibilityEvent

class QuestlockAccessibilityService : AccessibilityService() {
  private var lastHandledPackage: String? = null
  private var lastHandledAt = 0L

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

    val foreground = event.packageName?.toString() ?: return
    if (foreground == packageName) return
    if (!BlockStore.isBlockedNow(this, foreground)) return

    // A single app launch fires several window events; don't relaunch per event.
    val now = System.currentTimeMillis()
    if (foreground == lastHandledPackage && now - lastHandledAt < THROTTLE_MS) return
    lastHandledPackage = foreground
    lastHandledAt = now

    // HOME always works from an accessibility service and is what actually
    // enforces the block. Surfacing our own screen is best-effort on top:
    // background activity launch is restricted on newer Android versions.
    performGlobalAction(GLOBAL_ACTION_HOME)

    try {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse("$BLOCK_URL$foreground")).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }
      startActivity(intent)
    } catch (_: Throwable) {
      // Blocked launch still leaves the user on the home screen.
    }
  }

  override fun onInterrupt() {}

  companion object {
    private const val THROTTLE_MS = 1500L
    private const val BLOCK_URL = "prodappv1://blocked?package="
  }
}
