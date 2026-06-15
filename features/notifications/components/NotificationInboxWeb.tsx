'use client';

import React from 'react';
import { useNotifications } from '../../../packages/shared/src/notifications/useNotifications';
import { NOTIFICATION_TYPE_LABELS } from '../../../packages/shared/src/notifications/constants';
import { NotificationType } from '../../../packages/shared/src/notifications/types';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';

interface Props {
  userId?: string;
}

export const NotificationInboxWeb: React.FC<Props> = ({ userId }) => {
  const { isMilitaryTime } = useSettings();
  const { notifications, loading, unreadCount, markAsRead, markAllRead } =
    useNotifications(userId);

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading notifications…</p>;
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="font-medium text-gray-900">No notifications yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Alerts for load matches, chat, MOTUS, and CBLE will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-600">
          Inbox {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="text-sm text-[#00bfff] hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <ul className="divide-y divide-gray-100">
        {notifications.map((item) => {
          const isUnread = !item.read_at;
          const typeLabel =
            NOTIFICATION_TYPE_LABELS[item.type as NotificationType] ?? item.type;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (isUnread) void markAsRead(item.id);
                }}
                className={`w-full text-left py-3 px-3 rounded-xl transition ${
                  isUnread ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#00bfff]">
                    {typeLabel}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(item.created_at, isMilitaryTime)}
                  </span>
                </div>
                <p className="font-medium text-gray-900 mt-1">{item.title}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{item.body}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};