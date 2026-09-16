package expo.modules.questlockblocker

import android.service.notification.NotificationListenerService

// MediaSessionManager.getActiveSessions() requires the caller to be an enabled
// notification listener. This service exists purely to hold that permission —
// it does not read notification content.
class QuestlockNotificationListener : NotificationListenerService()
