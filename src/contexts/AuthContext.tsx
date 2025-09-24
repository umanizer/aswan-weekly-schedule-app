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
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (session?.user && !user)) {
        console.log('Setting user from auth state change');
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
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
        console.log('🔍 [DEBUG] Setting supabase user and fetching profile...');
        setSupabaseUser(supabaseUser);
        await fetchUserProfile(supabaseUser.id);
      } else {
        console.log('🔍 [DEBUG] No user found, setting loading to false');
        setLoading(false);
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Error in getInitialUser:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 [DEBUG] Starting fetchUserProfile for:', userId);

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

      // タイムアウトを追加
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
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