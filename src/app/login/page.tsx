'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading } = useAuth();
  const router = useRouter();

  // 認証済みユーザーは自動でメイン画面へリダイレクト
  useEffect(() => {
    if (user && !loading) {
      router.push('/main');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error);
      } else {
        // 成功時は認証状態変更により自動リダイレクト
        // useEffectでリダイレクトが処理される
      }
    } catch (err) {
      setError('予期しないエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態確認中のロード画面
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* ロゴ・タイトル */}
        <div className="flex flex-col items-center animate-fade-in-down">
          <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-elegant animate-float">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white text-center">
            週間予定管理
          </h1>
          <p className="mt-2 text-sm text-gray-200 text-center">
            Schedule Management System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm py-8 px-4 shadow-floating rounded-lg sm:px-10 animate-fade-in-up">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                label="メールアドレス"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={error && !email ? 'メールアドレスを入力してください' : ''}
              />
            </div>

            <div>
              <Input
                label="パスワード"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={error && !password ? 'パスワードを入力してください' : ''}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  ログイン状態を保持
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500 transition-all-smooth btn-hover-scale"
                  onClick={() => {
                    // TODO: パスワードリセット機能
                    alert('パスワードリセット機能は今後実装予定です');
                  }}
                >
                  パスワードをお忘れですか？
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full transition-all-smooth btn-hover-scale"
                loading={isLoading}
                disabled={!email || !password}
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </div>
          </form>

        </div>

        {/* フッター */}
        <div className="mt-8 text-center animate-fade-in-up">
          <p className="text-xs text-gray-300">
            &copy; 2025 週間予定管理システム. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
            <button className="hover:text-gray-300 transition-all-smooth btn-hover-scale">
              利用規約
            </button>
            <button className="hover:text-gray-300 transition-all-smooth btn-hover-scale">
              プライバシーポリシー
            </button>
            <button className="hover:text-gray-300 transition-all-smooth btn-hover-scale">
              お問い合わせ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}