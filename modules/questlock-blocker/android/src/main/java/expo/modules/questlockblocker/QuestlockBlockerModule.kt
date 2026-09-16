package expo.modules.questlockblocker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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

      // The setting stores components in either flattened form, so compare
      // parsed ComponentNames rather than raw strings.
      enabled.split(':').any { ComponentName.unflattenFromString(it) == expected }
    }

    Function("openAccessibilitySettings") {
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("getInstalledApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN, null).addCategory(Intent.CATEGORY_LAUNCHER)
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(intent, 0)
        .map {
          mapOf(
            "packageName" to it.activityInfo.packageName,
            "label" to it.loadLabel(pm).toString()
          )
        }
        .filter { it["packageName"] != context.packageName }
        .distinctBy { it["packageName"] }
        .sortedBy { it["label"]?.lowercase() }
    }

    Function("getBlockedPackages") {
      BlockStore.getBlocked(context).toList()
    }

    Function("setBlockedPackages") { packages: List<String> ->
      BlockStore.setBlocked(context, packages)
    }

    Function("grantUnlock") { packageName: String, minutes: Int ->
      BlockStore.grantUnlock(context, packageName, minutes)
    }

    Function("clearUnlock") { packageName: String ->
      BlockStore.clearUnlock(context, packageName)
    }

    Function("getUnlockUntil") { packageName: String ->
      BlockStore.getUnlockUntil(context, packageName).toDouble()
    }
  }
}
