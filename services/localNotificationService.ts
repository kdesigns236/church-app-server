// Local Notifications Service
// Simple, reliable notifications that work when app is in background

import { LocalNotifications } from '@capacitor/local-notifications';

export const localNotificationService = {
  // Initialize and request permission
  async initialize(): Promise<boolean> {
    try {
      // Request permission
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        console.log('[LocalNotifications] ✅ Permission granted');
        return true;
      } else {
        console.log('[LocalNotifications] ❌ Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[LocalNotifications] ❌ Initialization failed:', error);
      return false;
    }
  },

  // Show a chat notification
  async showChatNotification(senderName: string, message: string, chatId?: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `💬 ${senderName}`,
            body: message,
            id: Date.now(), // Unique ID
            schedule: { at: new Date(Date.now() + 100) }, // Show immediately
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#5B3A9D',
            extra: {
              type: 'chat',
              chatId: chatId || 'general'
            }
          }
        ]
      });
      
      console.log('[LocalNotifications] Chat notification sent');
    } catch (error) {
      console.error('[LocalNotifications] Failed to show chat notification:', error);
    }
  },

  // Show a sermon notification
  async showSermonNotification(title: string, description: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `📖 New Sermon: ${title}`,
            body: description,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#5B3A9D',
            extra: {
              type: 'sermon'
            }
          }
        ]
      });
      
      console.log('[LocalNotifications] Sermon notification sent');
    } catch (error) {
      console.error('[LocalNotifications] Failed to show sermon notification:', error);
    }
  },

  // Show an event notification
  async showEventNotification(eventName: string, time: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `📅 ${eventName}`,
            body: `Starting at ${time}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#5B3A9D',
            extra: {
              type: 'event'
            }
          }
        ]
      });
      
      console.log('[LocalNotifications] Event notification sent');
    } catch (error) {
      console.error('[LocalNotifications] Failed to show event notification:', error);
    }
  },

  // Show an announcement notification
  async showAnnouncementNotification(title: string, content: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `📢 ${title}`,
            body: content,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#5B3A9D',
            extra: {
              type: 'announcement'
            }
          }
        ]
      });
      
      console.log('[LocalNotifications] Announcement notification sent');
    } catch (error) {
      console.error('[LocalNotifications] Failed to show announcement notification:', error);
    }
  },

  // Handle notification click
  setupNotificationHandlers(): void {
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('[LocalNotifications] Notification clicked:', notification);
      
      const data = notification.notification.extra;
      
      // Navigate based on notification type
      switch (data?.type) {
        case 'chat':
          window.location.hash = '/chat';
          break;
        case 'sermon':
          window.location.hash = '/sermons';
          break;
        case 'event':
          window.location.hash = '/events';
          break;
        case 'announcement':
          window.location.hash = '/announcements';
          break;
        default:
          window.location.hash = '/';
      }
    });
  },

  // Check if permission is granted
  async hasPermission(): Promise<boolean> {
    try {
      const permission = await LocalNotifications.checkPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('[LocalNotifications] Failed to check permission:', error);
      return false;
    }
  }
};
