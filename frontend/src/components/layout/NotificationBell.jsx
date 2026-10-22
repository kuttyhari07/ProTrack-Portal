import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#111827]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[14px] bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-[#374151] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#172033] dark:text-[#F3F4F6]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#4F46E5] dark:text-[#818CF8] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#667085] dark:text-[#9CA3AF]">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start justify-between gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-[#1F2937]/50 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0" />
                      )}
                      <h4 className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] truncate">
                        {notif.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF] line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
