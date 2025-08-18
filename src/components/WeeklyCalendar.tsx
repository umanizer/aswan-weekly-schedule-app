'use client';

import { useState, useMemo } from 'react';
import { Button, ScheduleCard } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Task } from '@/lib/supabase';

// 週の日付を生成する関数
function getWeekDates(date: Date) {
  const week = [];
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - dayOfWeek; // 日曜日を週の開始とする
  
  startOfWeek.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  
  return week;
}

interface WeeklyCalendarProps {
  schedules: Task[];
  onScheduleClick?: (task: Task) => void;
  onNewScheduleClick?: (date: Date) => void;
  isAdmin?: boolean;
  onUserManagementClick?: () => void;
}

export function WeeklyCalendar({ schedules, onScheduleClick, onNewScheduleClick, isAdmin, onUserManagementClick }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // transport_methodに基づいてScheduleCardのtypeを判定する関数
  const getScheduleType = (task: Task): 'm-bin' | 'other-bin' | 'staff-only' => {
    switch (task.transport_method) {
      case 'M便':
        return 'm-bin';
      case '別便':
        return 'other-bin';
      case '人員のみ':
        return 'staff-only';
      default:
        // デフォルトはM便とする
        return 'm-bin';
    }
  };
  
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 週の移動
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // 指定日付の予定を取得
  const getSchedulesForDate = (date: Date) => {
    // 日本時間での日付比較を行う
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return schedules.filter(task => {
      // タスクの日時を日本時間で取得
      const taskDateTime = new Date(task.start_datetime);
      // UTCからJSTに変換（9時間プラス）
      const jstTaskDateTime = new Date(taskDateTime.getTime() + (9 * 60 * 60 * 1000));
      
      const taskYear = jstTaskDateTime.getFullYear();
      const taskMonth = String(jstTaskDateTime.getMonth() + 1).padStart(2, '0');
      const taskDay = String(jstTaskDateTime.getDate()).padStart(2, '0');
      const taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
      
      return taskDateStr === dateStr;
    });
  };
  
  // 今日かどうかの判定
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // 週末かどうかの判定
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 日曜日または土曜日
  };
  
  return (
    <div className="w-full">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 glass glass-high-contrast rounded-lg shadow-elegant space-y-4 sm:space-y-0 animate-slide-in-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">週間予定表</h1>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-600 rounded-full">
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </span>
        </div>
        
        {/* デスクトップ版：1行レイアウト */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {/* 週移動ボタン */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              前週
            </Button>
            
            <Button variant="secondary" size="sm" onClick={goToToday}>
              今週
            </Button>
            
            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              次週
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
          
          {/* 区切り線 */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* 新規予定ボタン */}
          <Button variant="primary" size="sm" onClick={() => onNewScheduleClick?.(new Date())}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規予定
          </Button>
          
          {/* 管理者ボタン */}
          {isAdmin && (
            <>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <Button variant="ghost" size="sm" onClick={onUserManagementClick}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                ユーザー管理
              </Button>
            </>
          )}
          
        </div>

        {/* モバイル版：2行レイアウト */}
        <div className="sm:hidden space-y-3">
          {/* 1行目：週移動ボタン */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="px-3">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                前週
              </Button>
              
              <Button variant="secondary" size="sm" onClick={goToToday} className="px-4">
                今週
              </Button>
              
              <Button variant="ghost" size="sm" onClick={goToNextWeek} className="px-3">
                次週
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
          
          {/* 2行目：機能ボタン */}
          <div className="flex justify-center space-x-2">
            <Button variant="primary" size="sm" onClick={() => onNewScheduleClick?.(new Date())} className="px-4 py-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規予定
            </Button>
            
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={onUserManagementClick} className="px-3 py-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                ユーザー管理
              </Button>
            )}
            
          </div>
        </div>
      </div>
      
      {/* カレンダーグリッド - PC・タブレット版 */}
      <div className="hidden md:block animate-slide-in-right animate-delay-200">
        <div className="grid grid-cols-7 gap-px bg-gray-300 dark:bg-gray-600 rounded-lg overflow-hidden shadow-floating">
          {/* 曜日ヘッダー */}
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`
                bg-gray-100 dark:bg-gray-700 p-3 text-center font-medium text-sm
                ${isWeekend(weekDates[index]) ? 'text-red-600 dark:text-cyan-300' : 'text-gray-900 dark:text-gray-50'}
              `}
            >
              {day}
            </div>
          ))}
          
          {/* 日付とスケジュール */}
          {weekDates.map((date, index) => {
            const schedules = getSchedulesForDate(date);
            
            return (
              <div
                key={date.toISOString()}
                className={`
                  glass p-3 min-h-[200px] flex flex-col hover-lift transition-all-smooth layout-stable
                  ${isWeekend(date) ? 'bg-red-50 dark:bg-purple-900 bg-opacity-50 dark:bg-opacity-25' : ''}
                `}
              >
                {/* 日付 */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`
                      text-sm font-medium px-2 py-1 rounded-full transition-all-smooth
                      ${isToday(date) 
                        ? 'gradient-primary text-white shadow-elegant animate-pulse-glow pulse-highlight' 
                        : isWeekend(date)
                        ? 'text-red-600 dark:text-cyan-300'
                        : 'text-gray-900 dark:text-gray-50'
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>
                  
                  {schedules.length > 0 && (
                    <span className="text-xs text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full animate-bounce-in animate-pulse-zoom">
                      {schedules.length}件
                    </span>
                  )}
                </div>
                
                {/* スケジュール一覧 */}
                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                  {schedules.map((task) => (
                    <ScheduleCard
                      key={task.id}
                      time={`${new Date(task.start_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })} - ${task.end_datetime ? new Date(task.end_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) : ''}`}
                      customerName={task.customer_name}
                      siteName={task.site_name}
                      siteAddress={task.site_address}
                      staffName={task.users?.full_name || '未設定'}
                      type={getScheduleType(task)}
                      isStaffAccompanied={task.is_staff_accompanied}
                      hasPartTimer={task.has_part_timer}
                      partTimerCount={task.part_timer_count || undefined}
                      transportCategories={task.transport_categories}
                      className="mb-0 p-2 text-xs"
                      onClick={() => onScheduleClick?.(task)}
                    />
                  ))}
                </div>
                
                {/* 新規予定追加エリア */}
                <button
                  onClick={() => onNewScheduleClick?.(date)}
                  className="
                    mt-2 p-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-all-smooth btn-hover-scale
                    border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500
                    animate-on-hover animate-on-click
                  "
                >
                  + 予定を追加
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* モバイル版リスト */}
      <div className="md:hidden space-y-4 animate-fade-slide-up animate-delay-300">
        {weekDates.map((date, index) => {
          const schedules = getSchedulesForDate(date);
          
          return (
            <div key={date.toISOString()} className="glass rounded-lg shadow-elegant hover-lift transition-all-smooth layout-stable">
              {/* 日付ヘッダー */}
              <div
                className={`
                  flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600
                  ${isWeekend(date) ? 'bg-red-50 dark:bg-indigo-900 bg-opacity-50 dark:bg-opacity-30' : 'bg-gray-50 dark:bg-gray-700'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`
                      text-lg font-bold px-3 py-1 rounded-full transition-all-smooth
                      ${isToday(date) 
                        ? 'gradient-primary text-white shadow-elegant animate-pulse-glow pulse-highlight' 
                        : isWeekend(date)
                        ? 'text-red-600 dark:text-cyan-300'
                        : 'text-gray-900 dark:text-gray-50'
                      }
                    `}
                  >
                    {date.getDate()}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {weekDays[index]}曜日
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-200">
                      {formatDate(date)}
                    </p>
                  </div>
                </div>
                
                {schedules.length > 0 && (
                  <span className="text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full animate-bounce-in animate-wave">
                    {schedules.length}件の予定
                  </span>
                )}
              </div>
              
              {/* スケジュール */}
              <div className="p-4 space-y-3">
                {schedules.length > 0 ? (
                  schedules.map((task) => (
                    <ScheduleCard
                      key={task.id}
                      time={`${new Date(task.start_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })} - ${task.end_datetime ? new Date(task.end_datetime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) : ''}`}
                      customerName={task.customer_name}
                      siteName={task.site_name}
                      siteAddress={task.site_address}
                      staffName={task.users?.full_name || '未設定'}
                      type={getScheduleType(task)}
                      isStaffAccompanied={task.is_staff_accompanied}
                      hasPartTimer={task.has_part_timer}
                      partTimerCount={task.part_timer_count || undefined}
                      transportCategories={task.transport_categories}
                      onClick={() => onScheduleClick?.(task)}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">予定はありません</p>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onNewScheduleClick?.(date)}
                >
                  + この日に予定を追加
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}