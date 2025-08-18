'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { fetchAllUsers, createUser, updateUser, deleteUser } from '@/lib/users';
import { User } from '@/lib/supabase';

export default function UsersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 新規ユーザー作成用の状態
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user'
  });

  // 編集用の状態
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'user' as 'admin' | 'user',
    email: ''
  });

  // 認証チェック
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/main');
    }
  }, [user, isAdmin, authLoading, router]);

  // ユーザー一覧取得
  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchAllUsers();
      if (error) {
        console.error('Failed to load users:', error);
        alert('ユーザー一覧の取得に失敗しました。');
      } else {
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 新規ユーザー作成
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserForm.email || !newUserForm.password || !newUserForm.full_name) {
      alert('すべての項目を入力してください。');
      return;
    }

    try {
      const { data, error } = await createUser(newUserForm);
      if (error) {
        console.error('Failed to create user:', error);
        alert('ユーザーの作成に失敗しました。');
      } else {
        alert('ユーザーを作成しました！');
        setIsCreateModalOpen(false);
        setNewUserForm({ email: '', password: '', full_name: '', role: 'user' });
        loadUsers();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('ユーザー作成中にエラーが発生しました。');
    }
  };

  // ユーザー編集
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !editForm.full_name) {
      alert('氏名を入力してください。');
      return;
    }

    try {
      const { data, error } = await updateUser(selectedUser.id, editForm);
      if (error) {
        console.error('Failed to update user:', error);
        alert('ユーザーの更新に失敗しました。');
      } else {
        alert('ユーザーを更新しました！');
        setIsEditModalOpen(false);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('ユーザー更新中にエラーが発生しました。');
    }
  };

  // ユーザー削除
  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === user?.id) {
      alert('自分自身は削除できません。');
      return;
    }

    if (!confirm(`${userToDelete.full_name} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const { error } = await deleteUser(userToDelete.id);
      if (error) {
        console.error('Failed to delete user:', error);
        alert('ユーザーの削除に失敗しました。');
      } else {
        alert('ユーザーを削除しました。');
        loadUsers();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('ユーザー削除中にエラーが発生しました。');
    }
  };

  // 編集モーダルを開く
  const openEditModal = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditForm({
      full_name: userToEdit.full_name,
      role: userToEdit.role,
      email: userToEdit.email || ''
    });
    setIsEditModalOpen(true);
  };

  if (authLoading || loading) {
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
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-down">
          <div>
            <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
            <p className="text-gray-200 mt-1">システムユーザーの管理</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/main')}
              className="transition-all-smooth btn-hover-scale"
            >
              予定管理に戻る
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="transition-all-smooth btn-hover-scale"
            >
              新規ユーザー作成
            </Button>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-elegant overflow-hidden animate-fade-in-up hover-lift transition-all-smooth">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              ユーザー一覧 ({users.length}名)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メールアドレス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役割
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50 transition-all-smooth">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shadow-elegant animate-float">
                            <span className="text-white font-medium text-sm">
                              {userItem.full_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.email || 'メールアドレス未設定'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {userItem.role === 'admin' ? '管理者' : '一般ユーザー'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.created_at || '').toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(userItem)}
                          className="transition-all-smooth btn-hover-scale"
                        >
                          編集
                        </Button>
                        {userItem.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem)}
                            className="text-red-600 hover:text-red-800 transition-all-smooth btn-hover-scale"
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 新規ユーザー作成モーダル */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-floating animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                新規ユーザー作成
              </h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <Input
                  label="メールアドレス"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  required
                />
                
                <Input
                  label="パスワード"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  required
                />
                
                <Input
                  label="氏名"
                  type="text"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    役割
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value as 'admin' | 'user'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all-smooth"
                  >
                    <option value="user">一般ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="transition-all-smooth btn-hover-scale"
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" variant="primary" className="transition-all-smooth btn-hover-scale">
                    作成
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-floating animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ユーザー編集
              </h3>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                <Input
                  label="氏名"
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    役割
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value as 'admin' | 'user'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all-smooth"
                  >
                    <option value="user">一般ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="transition-all-smooth btn-hover-scale"
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" variant="primary" className="transition-all-smooth btn-hover-scale">
                    更新
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}