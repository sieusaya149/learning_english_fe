import React, { useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings } from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isNotificationPanelOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    toggleNotificationPanel,
    setNotificationPanelOpen,
  } = useNotifications();

  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationPanelOpen &&
        panelRef.current &&
        bellRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setNotificationPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationPanelOpen, setNotificationPanelOpen]);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon and colors
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return {
          icon: '🏆',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
        };
      case 'streak':
        return {
          icon: '🔥',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
        };
      case 'practice':
        return {
          icon: '✨',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
        };
      case 'reminder':
        return {
          icon: '📚',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
        };
      case 'system':
        return {
          icon: '🔔',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
        };
      default:
        return {
          icon: '🔔',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
        };
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setNotificationPanelOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        ref={bellRef}
        onClick={toggleNotificationPanel}
        className={clsx(
          'relative p-2 rounded-full transition-colors',
          isNotificationPanelOpen
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isNotificationPanelOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setNotificationPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      className={clsx(
                        'group relative transition-colors',
                        notification.read
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-blue-50 hover:bg-blue-100'
                      )}
                    >
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex gap-3">
                          {/* Notification Icon */}
                          <div className={clsx(
                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg',
                            style.bgColor,
                            style.borderColor,
                            'border'
                          )}>
                            {notification.icon || style.icon}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              'text-sm font-medium',
                              notification.read ? 'text-gray-900' : 'text-gray-900'
                            )}>
                              {notification.title}
                            </p>
                            <p className={clsx(
                              'text-sm mt-1',
                              notification.read ? 'text-gray-600' : 'text-gray-700'
                            )}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Remove notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
                <button
                  onClick={() => {
                    setNotificationPanelOpen(false);
                    navigate('/profile');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                >
                  <Settings size={14} />
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 