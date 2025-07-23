import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'achievement' | 'streak' | 'practice' | 'reminder' | 'system';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isNotificationPanelOpen: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationPanel: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider Hook
export const useNotificationProvider = (): NotificationContextType => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        setNotifications(notificationsWithDates);
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Add new notification
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for certain types
    if (notificationData.type === 'achievement') {
      toast.success(`🏆 ${notificationData.title}`, {
        duration: 5000,
        style: {
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
        },
      });
    } else if (notificationData.type === 'streak') {
      toast.success(`🔥 ${notificationData.title}`, {
        duration: 4000,
        style: {
          background: '#fef2f2',
          border: '1px solid #ef4444',
          color: '#dc2626',
        },
      });
    }

    // Browser notification (if permission granted)
    if (Notification.permission === 'granted') {
      new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Toggle notification panel
  const toggleNotificationPanel = useCallback(() => {
    setIsNotificationPanelOpen(prev => !prev);
  }, []);

  // Set notification panel open state
  const setNotificationPanelOpen = useCallback((open: boolean) => {
    setIsNotificationPanelOpen(open);
  }, []);

  // Auto-remove old notifications (older than 30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setNotifications(prev => 
      prev.filter(notif => notif.timestamp > thirtyDaysAgo)
    );
  }, []);

  // Request notification permission on first load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    toggleNotificationPanel,
    setNotificationPanelOpen,
  };
};

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notificationValue = useNotificationProvider();
  
  return (
    <NotificationContext.Provider value={notificationValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper functions for creating common notification types
export const createAchievementNotification = (title: string, description: string, icon: string = '🏆') => ({
  type: 'achievement' as const,
  title,
  message: description,
  icon,
});

export const createStreakNotification = (days: number) => ({
  type: 'streak' as const,
  title: `${days} Day Streak! 🔥`,
  message: `Congratulations! You've maintained your practice streak for ${days} days.`,
  icon: '🔥',
});

export const createPracticeNotification = (practiceType: string, count: number) => ({
  type: 'practice' as const,
  title: 'Practice Completed! ✨',
  message: `Great job! You've completed ${count} ${practiceType} practice${count > 1 ? 's' : ''}.`,
  icon: '✨',
});

export const createReminderNotification = (message: string) => ({
  type: 'reminder' as const,
  title: 'Practice Reminder 📚',
  message,
  icon: '📚',
});

export const createSystemNotification = (title: string, message: string) => ({
  type: 'system' as const,
  title,
  message,
  icon: '🔔',
}); 