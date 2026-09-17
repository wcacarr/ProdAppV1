package expo.modules.questlockblocker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.content.pm.ResolveInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class QuestlockBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuestlockBlocker")

    Function("isAccessibilityServiceEnabled") {
      accessibilityEnabled()
    }

    // Jumps straight to Tasuku's own entry where the platform honours it,
    // instead of dumping the user in the Accessibility list to go hunting.
    Function("openAccessibilitySettings") {
      val component = ComponentName(context, QuestlockAccessibilityService::class.java)
      val flattened = component.flattenToString()
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val args = Bundle()
      args.putString(":settings:fragment_args_key", flattened)
      intent.putExtra(":settings:fragment_args_key", flattened)
      intent.putExtra(":settings:show_fragment_args", args)
      context.startActivity(intent)
    }

    // App info page — where sideloaded builds have to clear "restricted
    // settings" before accessibility can be turned on at all.
    Function("openAppInfo") {
      val intent = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.fromParts("package", context.packageName, null)
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    AsyncFunction("getInstalledApps") {
      installedApps()
    }

    Function("launchApp") { packageName: String ->
      launch(packageName)
    }

    Function("getLockStates") {
      lockStates()
    }

    Function("lockApp") { packageName: String ->
      BlockStore.lock(context, packageName)
    }

    Function("unlockApp") { packageName: String ->
      BlockStore.unlock(context, packageName)
    }

    Function("grantUnlock") { packageName: String, minutes: Int ->
      BlockStore.grantUnlock(context, packageName, minutes)
    }

    Function("isBlockedNow") { packageName: String ->
      BlockStore.isBlockedNow(context, packageName)
    }
  }

  private fun accessibilityEnabled(): Boolean {
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    )
    if (enabled == null) {
      return false
    }
    val expected = ComponentName(context, QuestlockAccessibilityService::class.java)
    for (part in enabled.split(":")) {
      if (ComponentName.unflattenFromString(part) == expected) {
        return true
      }
    }
    return false
  }

  // Icons come back as data URIs so the launcher grid can render them straight
  // into <Image source={{ uri }} />. Empty string means "no icon".
  private fun installedApps(): List<Map<String, String>> {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN, null)
    intent.addCategory(Intent.CATEGORY_LAUNCHER)

    @Suppress("DEPRECATION")
    val resolved: List<ResolveInfo> = pm.queryIntentActivities(intent, 0)

    val seen = HashSet<String>()
    val out = ArrayList<Map<String, String>>()
    for (info in resolved) {
      val packageName = info.activityInfo.packageName
      if (packageName == context.packageName) {
        continue
      }
      if (!seen.add(packageName)) {
        continue
      }
      val entry = HashMap<String, String>()
      entry["packageName"] = packageName
      entry["label"] = info.loadLabel(pm).toString()
      entry["icon"] = encodeIcon(info.loadIcon(pm))
      out.add(entry)
    }
    out.sortBy { it["label"]?.lowercase() ?: "" }
    return out
  }

  private fun launch(packageName: String): Boolean {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
    if (launchIntent == null) {
      return false
    }
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(launchIntent)
    return true
  }

  private fun lockStates(): List<Map<String, Any>> {
    val out = ArrayList<Map<String, Any>>()
    for (packageName in BlockStore.getBlocked(context)) {
      val entry = HashMap<String, Any>()
      entry["packageName"] = packageName
      entry["lockActiveAt"] = BlockStore.getLockActiveAt(context, packageName).toDouble()
      entry["unlockUntil"] = BlockStore.getUnlockUntil(context, packageName).toDouble()
      out.add(entry)
    }
    return out
  }

  private fun encodeIcon(drawable: Drawable): String {
    try {
      var bitmap: Bitmap? = null
      if (drawable is BitmapDrawable) {
        bitmap = drawable.bitmap
      }
      val scaled: Bitmap
      if (bitmap != null) {
        scaled = Bitmap.createScaledBitmap(bitmap, ICON_PX, ICON_PX, true)
      } else {
        scaled = Bitmap.createBitmap(ICON_PX, ICON_PX, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(scaled)
        drawable.setBounds(0, 0, ICON_PX, ICON_PX)
        drawable.draw(canvas)
      }
      val out = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.PNG, 100, out)
      val encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
      return "data:image/png;base64,$encoded"
    } catch (e: Throwable) {
      return ""
    }
  }

  companion object {
    private const val ICON_PX = 96
  }
}
