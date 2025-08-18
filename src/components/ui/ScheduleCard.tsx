import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ScheduleCardProps extends HTMLAttributes<HTMLDivElement> {
  time: string;
  customerName: string;
  siteName: string;
  siteAddress: string;
  staffName: string;
  type: 'm-bin' | 'other-bin' | 'staff-only';
  isStaffAccompanied?: boolean;
  hasPartTimer?: boolean;
  partTimerCount?: number;
  transportCategories?: {
    aswan: boolean;
    charter: boolean;
    charterCount?: number;
    shippingCompany: boolean;
    selectedCompany?: string;
    customCompany?: string;
    branchName?: string;
    noPickup: boolean;
  };
}

export function ScheduleCard({
  time,
  customerName,
  siteName,
  siteAddress,
  staffName,
  type,
  isStaffAccompanied = false,
  hasPartTimer = false,
  partTimerCount,
  transportCategories,
  className,
  ...props
}: ScheduleCardProps) {
  const typeClasses = {
    'm-bin': 'schedule-card-important',
    'other-bin': 'schedule-card-accompanied',
    'staff-only': 'schedule-card-part-timer',
  };

  const typeLabels = {
    'm-bin': 'M便',
    'other-bin': '別便',
    'staff-only': '人員のみ',
  };

  const typeColors = {
    'm-bin': 'text-red-600',
    'other-bin': 'text-amber-600',
    'staff-only': 'text-emerald-600',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-sm rounded-lg p-3 mb-2 cursor-pointer transition-all-smooth hover-lift shadow-elegant hover:shadow-floating layout-stable',
        'border-l-4',
        type === 'm-bin' ? 'border-red-400' : 
        type === 'other-bin' ? 'border-amber-400' : 'border-emerald-400',
        className
      )}
      {...props}
    >
      {/* 時間とタイプ */}
      <div className="mb-2">
        {/* 時間と運送区分ラベル */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm">
            <span className="font-medium text-blue-600 dark:text-blue-300">時間: </span>
            <span className="text-gray-900 dark:text-gray-50">{time}</span>
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded', 
            type === 'm-bin' ? 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900' :
            type === 'other-bin' ? 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900' : 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900'
          )}>
            {typeLabels[type]}
          </span>
        </div>
        
        {/* アイコン行 */}
        <div className="flex items-center justify-end space-x-1 flex-wrap min-h-[24px]">
          {/* 運送区分アイコン */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shadow-elegant w-6 h-6 justify-center ${
            type === 'm-bin' ? 'gradient-danger text-white' :
            type === 'other-bin' ? 'gradient-warning text-white' :
            'gradient-success text-white'
          }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={type === 'm-bin' ? "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" :
                   type === 'other-bin' ? "M8 9l4-4 4 4m0 6l-4 4-4-4" :
                   "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"}
              />
            </svg>
          </span>
          
          {/* 担当者同行アイコン */}
          {isStaffAccompanied && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium gradient-primary text-white shadow-elegant">
              👤
            </span>
          )}
          
          {/* 人員アイコン */}
          {hasPartTimer && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium gradient-success text-white shadow-elegant min-w-[32px] h-6">
              🙋‍♂️ {partTimerCount && `${partTimerCount}名`}
            </span>
          )}
        </div>
      </div>

      {/* 得意先名 */}
      <div className="mb-1">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-300">得意先名: </span>
        <span className="text-sm text-gray-900 dark:text-gray-50">{customerName}</span>
      </div>

      {/* 現場名 */}
      <div className="mb-1">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">現場名: </span>
        <span className="text-xs text-gray-700 dark:text-gray-100">{siteName}</span>
      </div>

      {/* 現場住所 */}
      <div className="mb-1">
        <span className="text-xs font-medium text-amber-600 dark:text-amber-300">現場住所: </span>
        <span className="text-xs text-gray-700 dark:text-gray-100 truncate">{siteAddress}</span>
      </div>

      {/* 担当者 */}
      <div className="mb-2">
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">担当: </span>
        <span className="text-xs text-gray-600 dark:text-gray-200">{staffName}</span>
      </div>

      {/* 引取り場所 */}
      {transportCategories && (transportCategories.aswan || transportCategories.charter || transportCategories.shippingCompany || transportCategories.noPickup) && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-300">引取り場所:</span>
          <div className="ml-2 space-y-1 min-h-[20px]">
            {transportCategories.shippingCompany && (
              <div className="flex items-center min-h-[16px]">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 shadow-elegant flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-100">
                  {transportCategories.selectedCompany === 'その他' 
                    ? transportCategories.customCompany 
                    : transportCategories.selectedCompany}
                  {transportCategories.branchName ? ` ${transportCategories.branchName}支店止め` : ''}
                </span>
              </div>
            )}
            {transportCategories.aswan && (
              <div className="flex items-center min-h-[16px]">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-elegant flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-100">アスワン広島支店止め</span>
              </div>
            )}
            {transportCategories.charter && (
              <div className="flex items-center min-h-[16px]">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-elegant flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-100">
                  チャーター {transportCategories.charterCount}台
                </span>
              </div>
            )}
            {transportCategories.noPickup && (
              <div className="flex items-center min-h-[16px]">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2 shadow-elegant flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-100">引取り等なし</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}