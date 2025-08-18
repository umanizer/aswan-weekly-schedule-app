'use client';

import { useState, useEffect, useRef } from 'react';
import { NotificationItem, fetchNotifications, markNotificationsAsRead, hasUnreadNotifications } from '@/lib/notification-feed';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 通知データを読み込む
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchNotifications(10);
      if (error) {
        console.error('Failed to load notifications:', error);
      } else {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Unexpected error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ドロップダウンが開かれた時に通知を読み込み、既読にマーク
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // 開いた時点で既読にマークする
      markNotificationsAsRead();
    }
  }, [isOpen]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // アクションタイプに応じたアイコンを取得
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'updated':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'deleted':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // アクションタイプに応じたテキストを取得
  const getActionText = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return '新しい予定が追加されました';
      case 'updated':
        return '予定が更新されました';
      case 'deleted':
        return '予定が削除されました';
      default:
        return '予定が変更されました';
    }
  };

  // 時刻をフォーマット
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'たった今';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}時間前`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}日前`;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed sm:absolute top-16 sm:top-auto right-4 sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-none bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-floating border border-gray-200 z-[9999] animate-scale-in"
    >
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">通知</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 通知リスト */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-gray-500">読み込み中...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm">通知はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {getActionIcon(notification.action_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.task_data.customer_name}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {getActionText(notification.action_type)}
                    </p>
                    <div className="mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="truncate">
                          {notification.task_data.site_name} • {notification.task_data.transport_method}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {new Date(notification.task_data.start_datetime).toLocaleString('ja-JP', {
                            timeZone: 'Asia/Tokyo',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      by {notification.user_name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              // すべての通知を表示する画面への遷移などを実装する場合
              console.log('Show all notifications');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            すべての通知を表示
          </button>
        </div>
      )}
    </div>
  );
}