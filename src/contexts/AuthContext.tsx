'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User, handleSupabaseError } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshSession: async () => false,
  checkSession: async () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回ロード時の認証状態チェック
    getInitialUser();

    // 認証状態の変更を監視（セッション自動更新対応）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', { event, session: session ? 'exists' : 'none' });

      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('User signed out or session expired');
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);

        // ログインページでなければリダイレクト
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔍 [DEBUG] Redirecting to login due to session expired');
          window.location.href = '/login';
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (session?.user && !user)) {
        console.log('Setting user from auth state change');
        setSupabaseUser(session.user);

        // 🔧 安全な基本認証データのみ使用（DBアクセス問題のため）
        console.log('🔍 [DEBUG] Using basic auth data safely');

        // メタデータまたはemailから表示名を決定
        const displayName = session.user.user_metadata?.full_name ||
                           session.user.user_metadata?.name ||
                           session.user.email?.split('@')[0] ||
                           'ユーザー';

        setUser({
          id: session.user.id,
          full_name: displayName,
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: session.user.updated_at || new Date().toISOString()
        });

        console.log('🔍 [DEBUG] User set successfully:', displayName);
        setLoading(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getInitialUser = async () => {
    console.log('🔍 [DEBUG] Starting getInitialUser...');
    try {
      console.log('🔍 [DEBUG] Calling supabase.auth.getUser()...');
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      console.log('🔍 [DEBUG] getUser result:', supabaseUser ? 'User found' : 'No user');

      if (supabaseUser) {
        console.log('🔍 [DEBUG] Setting supabase user - using basic auth data');
        setSupabaseUser(supabaseUser);

        // 🔧 安全な基本認証データのみ使用（DBアクセス問題のため）
        const displayName = supabaseUser.user_metadata?.full_name ||
                           supabaseUser.user_metadata?.name ||
                           supabaseUser.email?.split('@')[0] ||
                           'ユーザー';

        setUser({
          id: supabaseUser.id,
          full_name: displayName,
          email: supabaseUser.email || '',
          role: supabaseUser.user_metadata?.role || 'user',
          created_at: supabaseUser.created_at || new Date().toISOString(),
          updated_at: supabaseUser.updated_at || new Date().toISOString()
        });

        console.log('🔍 [DEBUG] User profile set from auth data:', displayName);
        setLoading(false);
      } else {
        console.log('🔍 [DEBUG] No user found, setting loading to false');
        setLoading(false);

        // ログインページでなければリダイレクト
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔍 [DEBUG] Redirecting to login - not on login page');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Error in getInitialUser:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // ログインページでは処理をスキップ
      if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
        console.log('🔍 [DEBUG] Skipping fetchUserProfile on login page');
        setLoading(false);
        return;
      }

      console.log('🔍 [DEBUG] Starting fetchUserProfile for:', userId);

      // 🔧 代替案：APIエンドポイント経由でユーザー情報取得
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('🔍 [DEBUG] User profile loaded via API:', userData.full_name);
          setUser({
            id: userData.id,
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
            created_at: userData.created_at,
            updated_at: userData.updated_at
          });
          setLoading(false);
          return;
        }

        console.log('🔍 [DEBUG] API profile fetch failed, falling back to direct query');
      } catch (apiError) {
        console.log('🔍 [DEBUG] API approach failed, using direct database query');
      }

      // セッションの有効性を確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log('Session invalid, signing out...');
        await supabase.auth.signOut();
        setUser(null);
        setSupabaseUser(null);
        setLoading(false); // 強制的にloading状態を解除
        return;
      }

      // タイムアウトを追加（3秒に短縮）
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );

      // ユーザープロフィールを取得
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching user profile:', error);
        console.error('Error details:', { message: error.message, details: error.details, hint: error.hint });

        // ユーザーが見つからない場合、または認証エラーの場合
        if (error.code === 'PGRST116' || error.message?.includes('JWT') || error.message === 'Request timeout') {
          console.log('User not found, auth error, or timeout - signing out...');
          await supabase.auth.signOut();
          setUser(null);
          setSupabaseUser(null);
          setLoading(false); // 強制的にloading状態を解除
        }
        return;
      }

      if (data) {
        console.log('🔍 [DEBUG] User profile loaded successfully:', data.full_name);
        setUser({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          created_at: data.created_at,
          updated_at: data.updated_at
        });
        console.log('🔍 [DEBUG] Setting loading to false after successful profile load');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // エラーが発生した場合はログアウトして安全な状態にする
      console.log('Forcing sign out due to error');
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setLoading(false); // 強制的にloading状態を解除
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // 実際のSupabase認証を使用
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: 'メールアドレスまたはパスワードが正しくありません。' };
      }

      // 認証成功時は onAuthStateChange で自動的にユーザー情報が設定される
      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'ログイン中にエラーが発生しました。' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  // セッションの確認
  const checkSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.log('Session check failed, signing out...');
        await signOut();
        return false;
      }

      // セッションが間もなく期限切れの場合、リフレッシュを試行
      const expiresAt = session.expires_at || 0;
      const now = Date.now() / 1000;
      const timeLeft = expiresAt - now;

      if (timeLeft < 300) { // 5分以内に期限切れの場合
        console.log('Session expires soon, refreshing...');
        return await refreshSession();
      }

      return true;
    } catch (error) {
      console.error('Session check error:', error);
      await signOut();
      return false;
    }
  };

  // セッションの手動リフレッシュ
  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.log('Session refresh failed, signing out...');
        await signOut();
        return false;
      }

      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      await signOut();
      return false;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        isAdmin,
        signIn,
        signOut,
        refreshSession,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}