import { supabase, User, handleSupabaseError } from './supabase';

//認証トークンを取得する関数
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Getting auth token, session:', session ? 'exists' : 'none');
    return session?.access_token || 'mock-token';
  } catch (error) {
    console.error('Error getting auth token:', error);
    return 'mock-token';
  }
};

// 全ユーザーの取得（管理者のみ）
export const fetchAllUsers = async () => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ユーザー一覧の取得に失敗しました');
    }

    const { data } = await response.json();
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: [], error: error.message };
  }
};

// 新規ユーザー作成（管理者のみ）
export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user';
}) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ユーザー作成に失敗しました');
    }

    const { data } = await response.json();
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { data: null, error: error.message };
  }
};

// ユーザー情報の更新（管理者のみ）
export const updateUser = async (userId: string, updates: {
  full_name?: string;
  role?: 'admin' | 'user';
  email?: string;
}) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ユーザー更新に失敗しました');
    }

    const { data } = await response.json();
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { data: null, error: error.message };
  }
};

// ユーザーの削除（管理者のみ）
export const deleteUser = async (userId: string) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`/api/users?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'ユーザー削除に失敗しました');
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { error: error.message };
  }
};

