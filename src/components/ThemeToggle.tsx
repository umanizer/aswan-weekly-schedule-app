'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'ライト', icon: '☀️' },
    { value: 'dark', label: 'ダーク', icon: '🌙' },
    { value: 'system', label: 'システム', icon: '💻' },
  ];

  const currentTheme = themeOptions.find(option => option.value === theme);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-sm rounded-lg hover:bg-white hover:bg-opacity-20 transition-all-smooth hover-lift text-white dark:text-gray-200 animate-on-hover animate-on-click"
        title="テーマ切り替え"
      >
        <span className="text-base">{currentTheme?.icon}</span>
        <span className="hidden sm:block">{currentTheme?.label}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* ドロップダウンメニュー */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-floating border border-gray-200 dark:border-gray-700 z-50 animate-scale-in">
            <div className="p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value as any);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-all-smooth
                    ${theme === option.value 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                  {theme === option.value && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                現在: {resolvedTheme === 'dark' ? 'ダーク' : 'ライト'}モード
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}