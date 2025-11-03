// Notification Service for Android push notifications
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  private isInitialized = false;
  private notificationId = 1;

  // Initialize notifications and request permissions
  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[Notifications] Not on native platform, skipping initialization');
      return false;
    }

    try {
      // Request permission
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        console.log('[Notifications] ✅ Permission granted');
        this.isInitialized = true;
        
        // Listen for notification clicks
        await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('[Notifications] Notification clicked:', notification);
          // Handle notification click (e.g., navigate to chat page)
        });
        
        return true;
      } else {
        console.log('[Notifications] ⚠️ Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[Notifications] ❌ Error initializing:', error);
      return false;
    }
  }

  // Send a notification for new chat message
  async notifyNewChatMessage(senderName: string, message: string): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.notificationId++,
            title: `💬 ${senderName}`,
            body: message,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1B365D',
            extra: {
              type: 'chat',
              route: '/chat'
            }
          }
        ]
      });
      
      console.log('[Notifications] 💬 Chat notification sent');
    } catch (error) {
      console.error('[Notifications] Error sending chat notification:', error);
    }
  }

  // Send notification for new sermon
  async notifyNewSermon(title: string, pastor: string): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.notificationId++,
            title: '🎤 New Sermon Posted',
            body: `${title} by ${pastor}`,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1B365D',
            extra: {
              type: 'sermon',
              route: '/sermons'
            }
          }
        ]
      });
      
      console.log('[Notifications] 🎤 Sermon notification sent');
    } catch (error) {
      console.error('[Notifications] Error sending sermon notification:', error);
    }
  }

  // Send notification for new announcement
  async notifyNewAnnouncement(title: string, category: string): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.notificationId++,
            title: `📢 ${category} Announcement`,
            body: title,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FFD700',
            extra: {
              type: 'announcement',
              route: '/announcements'
            }
          }
        ]
      });
      
      console.log('[Notifications] 📢 Announcement notification sent');
    } catch (error) {
      console.error('[Notifications] Error sending announcement notification:', error);
    }
  }

  // Send notification for new event
  async notifyNewEvent(title: string, date: string): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.notificationId++,
            title: '📅 New Event',
            body: `${title} on ${date}`,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1B365D',
            extra: {
              type: 'event',
              route: '/events'
            }
          }
        ]
      });
      
      console.log('[Notifications] 📅 Event notification sent');
    } catch (error) {
      console.error('[Notifications] Error sending event notification:', error);
    }
  }

  // Send notification for new Bible study
  async notifyNewBibleStudy(title: string, topic: string): Promise<void> {
    if (!this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.notificationId++,
            title: '📖 New Bible Study',
            body: `${title} - ${topic}`,
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#1B365D',
            extra: {
              type: 'bible-study',
              route: '/bible-study'
            }
          }
        ]
      });
      
      console.log('[Notifications] 📖 Bible Study notification sent');
    } catch (error) {
      console.error('[Notifications] Error sending Bible study notification:', error);
    }
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [] });
      console.log('[Notifications] Cleared all notifications');
    } catch (error) {
      console.error('[Notifications] Error clearing notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();
