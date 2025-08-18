'use client';

import { useState, useEffect } from 'react';
import { NotificationDropdown } from './NotificationDropdown';
import { hasUnreadNotifications } from '@/lib/notification-feed';

export function NotificationBell() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  // 未読通知の状態をチェック
  const checkUnreadNotifications = async () => {
    try {
      const unread = await hasUnreadNotifications();
      setHasUnread(unread);
    } catch (error) {
      console.error('Failed to check unread notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み時に未読通知をチェック
  useEffect(() => {
    checkUnreadNotifications();

    // 定期的に未読通知をチェック（30秒間隔）
    const interval = setInterval(checkUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // ドロップダウンが閉じられた時に未読状態をリセット
  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
    setHasUnread(false);
  };

  // ベルアイコンクリック時
  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      // 開く時に未読状態をリセット
      setHasUnread(false);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={handleBellClick}
        className="p-2 text-gray-200 hover:text-white relative transition-all-smooth btn-hover-scale rounded-lg hover:bg-white hover:bg-opacity-20"
        disabled={loading}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* 未読通知バッジ */}
        {hasUnread && !loading && (
          <span className="absolute top-1 right-1 w-2 h-2 gradient-danger rounded-full animate-pulse-glow shadow-elegant"></span>
        )}
        
        {/* ローディング状態 */}
        {loading && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-gray-300 rounded-full"></span>
        )}
      </button>

      {/* 通知ドロップダウン */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
      />
    </div>
  );
}