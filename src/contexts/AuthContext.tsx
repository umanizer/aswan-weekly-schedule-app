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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  isAdmin: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
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

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getInitialUser = async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        setSupabaseUser(supabaseUser);
        await fetchUserProfile(supabaseUser.id);
      }
    } catch (error) {
      console.error('Error getting initial user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      // ユーザープロフィールを取得
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        console.error('Error details:', { message: error.message, details: error.details, hint: error.hint });
        
        // ユーザーが見つからない場合は、ログアウトして再認証を促す
        if (error.code === 'PGRST116') {
          console.log('User not found in users table, signing out...');
          await supabase.auth.signOut();
          setUser(null);
          setSupabaseUser(null);
        }
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          created_at: data.created_at,
          updated_at: data.updated_at
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // エラーが発生した場合はログアウトして安全な状態にする
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}