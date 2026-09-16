package expo.modules.questlockblocker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

private const val ART_PX = 128

class QuestlockMediaModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuestlockMedia")

    Function("isNotificationAccessGranted") {
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ) ?: return@Function false
      val expected = ComponentName(context, QuestlockNotificationListener::class.java)
      enabled.split(':').any { ComponentName.unflattenFromString(it) == expected }
    }

    Function("openNotificationAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("getNowPlaying") {
      val controller = activeController() ?: return@Function null
      val metadata = controller.metadata
      val state = controller.playbackState

      mapOf(
        "isPlaying" to (state?.state == PlaybackState.STATE_PLAYING),
        "trackName" to (metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: ""),
        "artistName" to (
          metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
            ?: metadata?.getString(MediaMetadata.METADATA_KEY_AUTHOR)
            ?: ""
          ),
        "positionMs" to (state?.position?.toDouble() ?: 0.0),
        "durationMs" to (metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION)?.toDouble() ?: 0.0),
        "appPackage" to controller.packageName,
        "albumArtUrl" to encodeArt(metadata)
      )
    }

    Function("play") { transport { it.play() } }
    Function("pause") { transport { it.pause() } }
    Function("next") { transport { it.skipToNext() } }
    Function("previous") { transport { it.skipToPrevious() } }
  }

  /**
   * Prefers a session that is actually playing, otherwise the most recent one,
   * so a paused Audible book still shows up and can be resumed.
   */
  private fun activeController(): MediaController? = try {
    val manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
    val component = ComponentName(context, QuestlockNotificationListener::class.java)
    val sessions = manager.getActiveSessions(component)
    sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING }
      ?: sessions.firstOrNull()
  } catch (_: SecurityException) {
    null // notification access not granted yet
  } catch (_: Throwable) {
    null
  }

  private fun encodeArt(metadata: MediaMetadata?): String? {
    val bitmap = metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
      ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_ART)
      ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
      ?: return null
    return try {
      val scaled = Bitmap.createScaledBitmap(bitmap, ART_PX, ART_PX, true)
      val out = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
      "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    } catch (_: Throwable) {
      null
    }
  }

  private inline fun transport(action: (MediaController.TransportControls) -> Unit): Boolean {
    val controller = activeController() ?: return false
    return try {
      action(controller.transportControls)
      true
    } catch (_: Throwable) {
      false
    }
  }
}
