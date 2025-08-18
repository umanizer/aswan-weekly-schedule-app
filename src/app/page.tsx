'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 認証チェック（今は仮実装）
    const isAuthenticated = false; // TODO: 実際の認証チェック
    
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push('/main');
    }
  }, [router]);

  // ローディング画面を表示
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
          <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}