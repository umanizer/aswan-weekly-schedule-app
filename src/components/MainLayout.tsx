'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentUser?: {
    name: string;
    role: 'admin' | 'user';
    email: string;
  };
  onLogout?: () => void;
}

export function MainLayout({ children, currentUser, onLogout }: MainLayoutProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  
  // デフォルトユーザー情報
  const defaultUser = {
    name: '山田太郎',
    role: 'user' as 'admin' | 'user',
    email: 'yamada@example.com'
  };
  
  const user = currentUser || defaultUser;

  // 外側クリックでユーザーメニューを閉じる（一時的に無効化）
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
  //       setUserMenuOpen(false);
  //     }
  //   };

  //   if (userMenuOpen) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [userMenuOpen]);

  return (
    <div className="min-h-screen gradient-bg relative z-0">
      {/* ヘッダー */}
      <header className="glass glass-high-contrast shadow-elegant animate-fade-in-down relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ・タイトル */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-elegant animate-float animate-on-hover">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white dark:text-gray-50">週間予定管理</h1>
                <p className="text-xs text-gray-200 dark:text-gray-300 hidden sm:block">Schedule Management System</p>
              </div>
            </div>

            {/* ユーザーメニュー */}
            <div className="flex items-center space-x-4">
              {/* 通知アイコン */}
              <NotificationBell />
              
              {/* テーマ切り替え */}
              <ThemeToggle />

              {/* ユーザープロフィール */}
              <div className="relative z-50" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-white hover:bg-opacity-20 transition-all-smooth hover-lift animate-on-hover animate-on-click"
                >
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium shadow-elegant">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white dark:text-gray-50">{user.name}</p>
                    <p className="text-xs text-gray-200 dark:text-gray-300 hidden sm:block">
                      {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-200 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* ユーザーメニュードロップダウン */}
                {userMenuOpen && (
                  <div 
                    className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-0 sm:mt-2 w-auto sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    {/* 閉じるボタン */}
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="p-2">
                      {/* ユーザー情報 */}
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 mb-1 pr-8">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{user.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-200">{user.email}</p>
                      </div>
                      
                      {/* ログアウトボタン */}
                      <div 
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUserMenuOpen(false);
                          
                          const isMobile = window.innerWidth < 640;
                          
                          if (onLogout) {
                            // onLogout関数が提供されている場合はそれを使用
                            onLogout();
                          } else {
                            // デフォルトのログアウト処理
                            if (isMobile) {
                              // スマホの場合は警告なしでログアウト
                              await signOut();
                            } else {
                              // PCの場合は確認ダイアログを表示
                              if (confirm('ログアウトしますか？')) {
                                await signOut();
                              }
                            }
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md cursor-pointer"
                      >
                        <svg className="w-4 h-4 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        ログアウト
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2025 週間予定管理システム. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ユーザーメニューを開いている時の背景オーバーレイ（モバイル用） - 一時的に無効化 */}
      {/* {userMenuOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black bg-opacity-25 sm:hidden"
          onClick={() => setUserMenuOpen(false)}
        />
      )} */}
    </div>
  );
}