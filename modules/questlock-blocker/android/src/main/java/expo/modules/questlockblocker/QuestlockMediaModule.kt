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

class QuestlockMediaModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuestlockMedia")

    Function("isNotificationAccessGranted") {
      notificationAccessGranted()
    }

    Function("openNotificationAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("getNowPlaying") {
      nowPlaying()
    }

    Function("seekTo") { positionMs: Double ->
      seek(positionMs)
    }

    Function("play") { sendTransport("play") }
    Function("pause") { sendTransport("pause") }
    Function("next") { sendTransport("next") }
    Function("previous") { sendTransport("previous") }
  }

  private fun notificationAccessGranted(): Boolean {
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners"
    )
    if (enabled == null) {
      return false
    }
    val expected = ComponentName(context, QuestlockNotificationListener::class.java)
    for (part in enabled.split(":")) {
      if (ComponentName.unflattenFromString(part) == expected) {
        return true
      }
    }
    return false
  }

  private fun nowPlaying(): Map<String, Any?>? {
    val controller = activeController()
    if (controller == null) {
      return null
    }
    val metadata = controller.metadata
    val playback = controller.playbackState

    val isPlaying = playback != null && playback.state == PlaybackState.STATE_PLAYING
    val position = if (playback != null) playback.position.toDouble() else 0.0
    val duration = if (metadata != null) {
      metadata.getLong(MediaMetadata.METADATA_KEY_DURATION).toDouble()
    } else {
      0.0
    }

    val result = HashMap<String, Any?>()
    result["isPlaying"] = isPlaying
    result["trackName"] = readTitle(metadata)
    result["artistName"] = readArtist(metadata)
    result["positionMs"] = position
    result["durationMs"] = duration
    result["appPackage"] = controller.packageName
    result["appName"] = appLabel(controller.packageName)
    result["albumArtUrl"] = encodeArt(metadata)
    return result
  }

  // Apps are inconsistent about which metadata keys they fill in. Spotify and
  // others populate only the DISPLAY_* fields in some states, so every
  // reasonable key is tried before giving up.
  private fun readTitle(metadata: MediaMetadata?): String {
    if (metadata == null) {
      return ""
    }
    val keys = arrayOf(
      MediaMetadata.METADATA_KEY_TITLE,
      MediaMetadata.METADATA_KEY_DISPLAY_TITLE
    )
    for (key in keys) {
      val value = metadata.getString(key)
      if (!value.isNullOrBlank()) {
        return value
      }
    }
    return ""
  }

  private fun readArtist(metadata: MediaMetadata?): String {
    if (metadata == null) {
      return ""
    }
    val keys = arrayOf(
      MediaMetadata.METADATA_KEY_ARTIST,
      MediaMetadata.METADATA_KEY_ALBUM_ARTIST,
      MediaMetadata.METADATA_KEY_AUTHOR,
      MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE,
      MediaMetadata.METADATA_KEY_ALBUM
    )
    for (key in keys) {
      val value = metadata.getString(key)
      if (!value.isNullOrBlank()) {
        return value
      }
    }
    return ""
  }

  /** "Spotify", so a session with no usable metadata still says something. */
  private fun appLabel(packageName: String): String {
    try {
      val pm = context.packageManager
      return pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
    } catch (e: Throwable) {
      return ""
    }
  }

  /**
   * Picks the session worth showing.
   *
   * Taking the first playing session was not enough: several apps and the
   * system itself can hold a session at once, and a playing-but-empty one
   * would win over the app the user can actually hear — which is how Spotify
   * ended up displayed as "nothing playing". Sessions are scored instead, so
   * having usable metadata counts for as much as being in the playing state,
   * and a paused-but-labelled book still shows up to be resumed.
   */
  private fun activeController(): MediaController? {
    try {
      val service = context.getSystemService(Context.MEDIA_SESSION_SERVICE)
      if (service !is MediaSessionManager) {
        return null
      }
      val component = ComponentName(context, QuestlockNotificationListener::class.java)
      val all = service.getActiveSessions(component)
      val sessions = all.filter { it.packageName != context.packageName }
      if (sessions.isEmpty()) {
        return null
      }
      return sessions.maxByOrNull { score(it) }
    } catch (e: SecurityException) {
      return null // notification access not granted yet
    } catch (e: Throwable) {
      return null
    }
  }

  private fun score(session: MediaController): Int {
    var points = 0
    val state = session.playbackState?.state
    if (state == PlaybackState.STATE_PLAYING) {
      points += 4
    } else if (state == PlaybackState.STATE_BUFFERING || state == PlaybackState.STATE_PAUSED) {
      // Buffering is about to be playing; paused is still worth offering.
      points += 2
    }
    if (readTitle(session.metadata).isNotEmpty()) {
      points += 3
    }
    if (session.playbackState?.actions?.and(PlaybackState.ACTION_PLAY_PAUSE) != 0L) {
      points += 1
    }
    return points
  }

  private fun sendTransport(action: String): Boolean {
    val controller = activeController()
    if (controller == null) {
      return false
    }
    try {
      val controls = controller.transportControls
      when (action) {
        "play" -> controls.play()
        "pause" -> controls.pause()
        "next" -> controls.skipToNext()
        "previous" -> controls.skipToPrevious()
      }
      return true
    } catch (e: Throwable) {
      return false
    }
  }

  private fun seek(positionMs: Double): Boolean {
    val controller = activeController()
    if (controller == null) {
      return false
    }
    try {
      controller.transportControls.seekTo(positionMs.toLong())
      return true
    } catch (e: Throwable) {
      return false
    }
  }

  private fun encodeArt(metadata: MediaMetadata?): String? {
    if (metadata == null) {
      return null
    }
    var bitmap: Bitmap? = metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
    if (bitmap == null) {
      bitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ART)
    }
    if (bitmap == null) {
      bitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
    }
    if (bitmap == null) {
      return null
    }
    try {
      val scaled = Bitmap.createScaledBitmap(bitmap, ART_PX, ART_PX, true)
      val out = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
      val encoded = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
      return "data:image/jpeg;base64,$encoded"
    } catch (e: Throwable) {
      return null
    }
  }

  companion object {
    private const val ART_PX = 128
  }
}
