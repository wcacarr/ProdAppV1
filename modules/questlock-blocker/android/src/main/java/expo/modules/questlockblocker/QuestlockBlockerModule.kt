package expo.modules.questlockblocker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
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

private const val ICON_PX = 96

class QuestlockBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuestlockBlocker")

    Function("isAccessibilityServiceEnabled") {
      val expected = ComponentName(context, QuestlockAccessibilityService::class.java)
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return@Function false

      enabled.split(':').any { ComponentName.unflattenFromString(it) == expected }
    }

    Function("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    // Icons come back as data URIs so the launcher grid can render them
    // directly in <Image source={{ uri }} />.
    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN, null).addCategory(Intent.CATEGORY_LAUNCHER)
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(intent, 0)
        .distinctBy { it.activityInfo.packageName }
        .filter { it.activityInfo.packageName != context.packageName }
        .map {
          mapOf(
            "packageName" to it.activityInfo.packageName,
            "label" to it.loadLabel(pm).toString(),
            "icon" to encodeIcon(it.loadIcon(pm))
          )
        }
        .sortedBy { (it["label"] as? String)?.lowercase() }
    }

    Function("launchApp") { packageName: String ->
      val launch = context.packageManager.getLaunchIntentForPackage(packageName)
        ?: return@Function false
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(launch)
      true
    }

    Function("getLockStates") {
      BlockStore.getBlocked(context).map {
        mapOf(
          "packageName" to it,
          "lockActiveAt" to BlockStore.getLockActiveAt(context, it).toDouble(),
          "unlockUntil" to BlockStore.getUnlockUntil(context, it).toDouble()
        )
      }
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

  private fun encodeIcon(drawable: Drawable): String? = try {
    val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
      Bitmap.createScaledBitmap(drawable.bitmap, ICON_PX, ICON_PX, true)
    } else {
      Bitmap.createBitmap(ICON_PX, ICON_PX, Bitmap.Config.ARGB_8888).also {
        val canvas = Canvas(it)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
      }
    }
    val out = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
    "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  } catch (_: Throwable) {
    null
  }
}
