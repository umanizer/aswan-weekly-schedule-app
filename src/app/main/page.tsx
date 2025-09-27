'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { Modal, Input, Button } from '@/components/ui';
import WorkRequestModal, { WorkRequestFormData } from '@/components/WorkRequestModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task } from '@/lib/supabase';
import { fetchAllTasks, getTasksStats, createTask, updateTask, deleteTask, fetchMBinTasksForDate } from '@/lib/tasks';
import { notifyTaskCreated, notifyTaskUpdated, notifyTaskDeleted } from '@/lib/notifications';

// Supabase Taskインターフェースを使用

// モックデータの初期値を関数として定義（削除予定）
const getInitialSchedules = () => [
  {
    id: '1',
    customerName: '重要案件株式会社',
    siteName: '本社ビル',
    siteAddress: '東京都渋谷区神南1-1-1',
    startTime: '09:00',
    endTime: '17:00',
    staffName: '山田太郎',
    type: 'm-bin',
    isStaffAccompanied: true,
    hasPartTimer: false,
    transportMethod: 'エムワーク便',
    date: new Date().toISOString().split('T')[0],
    transportCategories: {
      aswan: true,
      charter: false,
      shippingCompany: false,
    },
  },
  {
    id: '2',
    customerName: 'サンプル商事',
    siteName: '大阪支社',
    siteAddress: '大阪府大阪市北区梅田1-1-1',
    startTime: '10:00',
    endTime: '15:00',
    staffName: '佐藤花子',
    type: 'other-bin',
    isStaffAccompanied: true,
    hasPartTimer: false,
    transportMethod: '別便',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  },
  {
    id: '3',
    customerName: '物流センター',
    siteName: '千葉倉庫',
    siteAddress: '千葉県千葉市中央区1-1-1',
    startTime: '13:00',
    endTime: '18:00',
    staffName: '鈴木次郎',
    type: 'staff-only',
    isStaffAccompanied: false,
    hasPartTimer: true,
    partTimerCount: 3,
    transportMethod: '人員のみ',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
  },
  {
    id: '4',
    customerName: '定期配送先',
    siteName: '埼玉営業所',
    siteAddress: '埼玉県さいたま市大宮区1-1-1',
    startTime: '08:00',
    endTime: '12:00',
    staffName: '田中三郎',
    type: 'm-bin',
    isStaffAccompanied: false,
    hasPartTimer: false,
    transportMethod: 'エムワーク便',
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
  },
  {
    id: '5',
    customerName: '緊急案件株式会社',
    siteName: '横浜工場',
    siteAddress: '神奈川県横浜市港北区1-1-1',
    startTime: '14:00',
    endTime: '18:00',
    staffName: '田中管理',
    type: 'other-bin',
    isStaffAccompanied: true,
    hasPartTimer: true,
    partTimerCount: 2,
    transportMethod: '別便',
    date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
    transportCategories: {
      aswan: false,
      charter: true,
      charterCount: 3,
      shippingCompany: true,
      selectedCompany: 'オカケン',
      branchName: '品川',
    },
  },
];

// 運送会社のプリセットリスト
const SHIPPING_COMPANIES = [
  'オカケン',
  '福山通運',
  'トナミ運輸',
  '西濃運輸',
  'その他'
];

export default function MainPage() {
  const { user, supabaseUser, loading: authLoading, isAdmin, signOut, checkSession } = useAuth();
  const router = useRouter();
  
  // 認証チェック：未認証ユーザーはログイン画面へリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 状態管理
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);

  // データ取得
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // 定期的なセッションチェック（5分ごと）
  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        console.log('Performing periodic session check...');
        const isValid = await checkSession();
        if (!isValid) {
          console.log('Session invalid, redirecting to login...');
          router.push('/login');
        }
      }, 5 * 60 * 1000); // 5分

      return () => clearInterval(interval);
    }
  }, [user, checkSession, router]);

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const { data, error } = await fetchAllTasks();
      if (error) {
        console.error('Tasks loading error:', error);
      } else {
        console.log('Tasks loaded successfully:', data.length, 'tasks');
        // 最初のタスクのユーザー情報をデバッグ
        if (data.length > 0) {
          console.log('First task user info:', {
            user_id: data[0].user_id,
            users: data[0].users
          });
          console.log('First task users object details:', JSON.stringify(data[0].users, null, 2));
          console.log('Full first task data:', JSON.stringify(data[0], null, 2));
        }
        setTasks(data);
      }
    } catch (error) {
      console.error('Unexpected error loading tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isWorkRequestModalOpen, setIsWorkRequestModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hasPartTimer, setHasPartTimer] = useState(false);
  const [partTimerCount, setPartTimerCount] = useState<number>(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [transportMethod, setTransportMethod] = useState<string>('');

  // 運送区分の状態管理
  const [transportCategories, setTransportCategories] = useState({
    aswan: false,
    charter: false,
    charterCount: 1,
    shippingCompany: false,
    selectedCompany: '',
    customCompany: '',
    branchName: '',
    noPickup: false,
  });


  // ログアウト処理
  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      router.push('/login');
    }
  };

  // 依頼書作成処理
  const handleCreateWorkRequest = async (task: Task) => {
    if (!task || !user) {
      alert('エラー: 予定またはユーザー情報が見つかりません。');
      return;
    }

    // 依頼書作成モーダルを開く
    setIsWorkRequestModalOpen(true);
  };

  // 依頼書作成フォーム送信処理
  const handleWorkRequestSubmit = async (formData: WorkRequestFormData) => {
    if (!selectedTask || !user) {
      alert('エラー: 予定またはユーザー情報が見つかりません。');
      return;
    }

    try {
      console.log('Creating work request with data:', formData);

      // APIエンドポイントに依頼書データを送信
      const response = await fetch('/api/work-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTask.id,
          user_id: user.id,
          meeting_time: formData.meeting_time,
          meeting_place: formData.meeting_place,
          customer_contact_person: formData.customer_contact_person,
          customer_phone: formData.customer_phone,
          work_content: formData.work_content,
          equipment: formData.equipment,
          cart_count: formData.cart_count,
          abacus_count: formData.abacus_count,
          material_loading: formData.material_loading,
          additional_remarks: formData.additional_remarks,
        }),
      });

      if (!response.ok) {
        throw new Error('依頼書の作成に失敗しました。');
      }

      const workRequest = await response.json();
      console.log('Work request created:', workRequest);

      // 成功メッセージ
      alert('依頼書を作成しました！\n\n次の手順:\n1. PDF生成機能を実装中です\n2. しばらくお待ちください');

      // モーダルを閉じる
      setIsWorkRequestModalOpen(false);

      // TODO: PDF生成処理を実装

    } catch (error) {
      console.error('Error creating work request:', error);
      alert('依頼書の作成中にエラーが発生しました。');
    }
  };

  // 権限チェック
  const canEditTask = (task: Task) => {
    console.log('🔍 Edit check:', {
      isAdmin,
      userName: user?.full_name,
      taskUserName: task.users?.full_name,
      taskUserId: task.user_id,
      currentUserId: user?.id
    });

    // 管理者は全ての予定を編集可能
    if (isAdmin) {
      return true;
    }

    // 一般ユーザーは自分の予定のみ編集可能
    return user?.id === task.user_id;
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
    setIsEditMode(false);
  };

  const handleNewScheduleClick = (date: Date) => {
    setSelectedDate(date);
    setIsNewTaskModalOpen(true);
  };

  // 日付と時刻を結合してISO文字列にする関数（日本時間で処理）
  const combineDateTime = (date: Date | null, time: string): string => {
    if (!date || !time) {
      return new Date().toISOString();
    }

    const [hours, minutes] = time.split(':').map(Number);

    // 日本時間での日付を正確に処理
    // ローカルタイムゾーンの影響を受けないよう、直接日本時間で作成
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(hours).padStart(2, '0');
    const minute = String(minutes).padStart(2, '0');

    // 日本時間（JST）として作成
    const result = `${year}-${month}-${day}T${hour}:${minute}:00+09:00`;

    console.log('combineDateTime:', { input: { date: date.toDateString(), time }, output: result });
    return result;
  };

  // 5分単位の時間オプションを生成
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  // 終了時刻の最小値を計算（開始時刻+5分）
  const getMinEndTime = (startTime: string): string => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes) + 5, 0, 0);
    
    return startDate.toTimeString().slice(0, 5);
  };

  // 時刻バリデーション
  const validateTimes = (startTime: string, endTime: string): { valid: boolean; message?: string } => {
    if (!startTime) {
      return { valid: false, message: '開始時間は必須です' };
    }
    
    if (endTime && startTime >= endTime) {
      return { valid: false, message: '終了時間は開始時間より後に設定してください' };
    }
    
    return { valid: true };
  };

  // 運送区分詳細バリデーション
  const validateTransportCategories = (categories: typeof transportCategories): { valid: boolean; message?: string } => {
    const { aswan, charter, shippingCompany, noPickup } = categories;
    
    // いずれか一つは選択必須
    if (!aswan && !charter && !shippingCompany && !noPickup) {
      return { valid: false, message: '運送区分詳細から少なくとも一つを選択してください' };
    }
    
    return { valid: true };
  };

  // 時間重複判定のヘルパー関数
  const isTimeOverlapping = (
    start1: string, end1: string | null,
    start2: string, end2: string | null
  ): boolean => {
    const s1 = new Date(start1);
    const e1 = end1 ? new Date(end1) : new Date(s1.getTime() + 60 * 60 * 1000); // 終了時間がない場合は1時間後とする
    const s2 = new Date(start2);
    const e2 = end2 ? new Date(end2) : new Date(s2.getTime() + 60 * 60 * 1000);
    
    // 重複判定: 新規予定の開始が既存予定の範囲内、または新規予定の終了が既存予定の範囲内、または新規予定が既存予定を包含
    return (s1 < e2 && e1 > s2);
  };

  // M便時間重複チェック
  const validateMBinTimeConflict = async (
    transportMethod: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeTaskId?: number
  ): Promise<{ valid: boolean; message?: string }> => {
    if (transportMethod !== 'M便' && transportMethod !== 'エムワーク便') {
      return { valid: true };
    }

    try {
      const { data: existingMBinTasks, error } = await fetchMBinTasksForDate(date, excludeTaskId);
      
      if (error) {
        console.error('M便予定取得エラー:', error);
        return { valid: true }; // エラー時は通す
      }

      const newStartDateTime = combineDateTime(date, startTime);
      const newEndDateTime = endTime ? combineDateTime(date, endTime) : null;

      for (const task of existingMBinTasks) {
        if (isTimeOverlapping(newStartDateTime, newEndDateTime, task.start_datetime, task.end_datetime)) {
          return { 
            valid: false, 
            message: 'エムワーク便の予定が重複しています。別便もしくは人員を別で手配してください。' 
          };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('M便重複チェックエラー:', error);
      return { valid: true }; // エラー時は通す
    }
  };

  // 区分変更時の制御
  const handleTransportMethodChange = (value: string) => {
    setTransportMethod(value);
    
    // 「人員のみ」を選択した場合、自動的に人員チェックをONにする
    if (value === '人員のみ') {
      setHasPartTimer(true);
    }
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setIsEditMode(false);
    setStartTime('08:00');
    setEndTime('09:00');
    setTransportMethod('');
  };

  const closeNewTaskModal = () => {
    setIsNewTaskModalOpen(false);
    setSelectedDate(null);
    setHasPartTimer(false);
    setPartTimerCount(1);
    setStartTime('08:00');
    setEndTime('09:00');
    setTransportMethod('');
    // 運送区分の状態もリセット
    setTransportCategories({
      aswan: false,
      charter: false,
      charterCount: 1,
      shippingCompany: false,
      selectedCompany: '',
      customCompany: '',
      branchName: '',
      noPickup: false,
    });
  };

  // 新規予定作成
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!user) {
      alert('ログインが必要です。');
      return;
    }

    // 「人員のみ」選択時の必須バリデーション
    const transportMethodValue = formData.get('transportMethod') as string;
    if (transportMethodValue === '人員のみ' && !hasPartTimer) {
      alert('「人員のみ」を選択した場合、人員情報の入力は必須です。');
      return;
    }

    // 人員時間のバリデーション
    if (hasPartTimer && !formData.get('partTimerDuration')) {
      alert('人員を選択した場合、時間の選択は必須です。');
      return;
    }

    // 時刻バリデーション
    const startTimeValue = formData.get('startTime') as string;
    const endTimeValue = formData.get('endTime') as string;
    const timeValidation = validateTimes(startTimeValue, endTimeValue);
    
    if (!timeValidation.valid) {
      alert(timeValidation.message);
      return;
    }

    // 運送区分詳細バリデーション
    const transportValidation = validateTransportCategories(transportCategories);
    
    if (!transportValidation.valid) {
      alert(transportValidation.message);
      return;
    }

    // M便時間重複チェック
    const newTransportMethodValue = formData.get('transportMethod') as string;
    const mBinValidation = await validateMBinTimeConflict(
      newTransportMethodValue,
      selectedDate!,
      startTimeValue,
      endTimeValue
    );
    
    if (!mBinValidation.valid) {
      alert(mBinValidation.message);
      return;
    }
    
    console.log('Creating new task...', {
      customerName: formData.get('customerName'),
      siteName: formData.get('siteName'),
      transportMethod: formData.get('transportMethod'),
      selectedDate: selectedDate?.toISOString().split('T')[0],
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      startTimeValue: startTimeValue,
      endTimeValue: endTimeValue,
      user_id: user.id,
      user_full_name: user.full_name
    });
    
    const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'users'> = {
      user_id: user.id,
      customer_name: formData.get('customerName') as string,
      site_name: formData.get('siteName') as string,
      site_address: formData.get('siteAddress') as string,
      start_datetime: combineDateTime(selectedDate, formData.get('startTime') as string),
      end_datetime: endTimeValue && endTimeValue.trim() ? combineDateTime(selectedDate, endTimeValue) : undefined,
      goods_description: formData.get('goodsDescription') as string,
      is_staff_accompanied: formData.get('isStaffAccompanied') === 'on',
      has_part_timer: hasPartTimer,
      part_timer_count: hasPartTimer ? partTimerCount : undefined,
      part_timer_duration: hasPartTimer ? (formData.get('partTimerDuration') as string) || undefined : undefined,
      transport_method: formData.get('transportMethod') as string,
      remarks: (formData.get('remarks') as string) || undefined,
      transport_categories: {
        aswan: transportCategories.aswan,
        charter: transportCategories.charter,
        charterCount: transportCategories.charter ? transportCategories.charterCount : undefined,
        shippingCompany: transportCategories.shippingCompany,
        selectedCompany: transportCategories.shippingCompany ? transportCategories.selectedCompany : undefined,
        customCompany: transportCategories.shippingCompany && transportCategories.selectedCompany === 'その他' ? transportCategories.customCompany : undefined,
        branchName: transportCategories.shippingCompany ? transportCategories.branchName : undefined,
        noPickup: transportCategories.noPickup,
      },
    };

    try {
      const { data: createdTask, error } = await createTask(newTask);
      if (error) {
        console.error('Task creation error:', error);
        alert('予定の作成に失敗しました。');
      } else {
        await loadTasks(); // データ再読み込み
        closeNewTaskModal();
        alert('予定を追加しました！');
        
        // 通知送信（エラーが発生してもメイン処理は継続）
        if (createdTask) {
          try {
            await notifyTaskCreated(createdTask, user.full_name);
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error creating task:', error);
      alert('予定の作成中にエラーが発生しました。');
    }
  };

  // 予定削除
  const handleDeleteTask = async () => {
    if (selectedTask && canEditTask(selectedTask)) {
      try {
        const { error } = await deleteTask(selectedTask.id);
        if (error) {
          console.error('Task deletion error:', error);
          alert('予定の削除に失敗しました。');
        } else {
          // 削除前にタスクデータを保存（通知用）
          const deletedTaskData = { ...selectedTask };
          
          await loadTasks(); // データ再読み込み
          closeTaskModal();
          alert('予定を削除しました！');
          
          // 通知送信（エラーが発生してもメイン処理は継続）
          try {
            await notifyTaskDeleted(deletedTaskData, user?.full_name || 'Unknown User');
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      } catch (error) {
        console.error('Unexpected error deleting task:', error);
        alert('予定の削除中にエラーが発生しました。');
      }
    } else {
      alert('この予定を削除する権限がありません。');
    }
  };

  // 編集モード切り替え
  const handleEditTask = () => {
    if (selectedTask && canEditTask(selectedTask)) {
      // 選択された予定の値でフォームの初期値を設定
      setHasPartTimer(selectedTask.has_part_timer || false);
      setPartTimerCount(selectedTask.part_timer_count || 1);
      
      // 時間の初期値を設定（日本時間で正確に取得）
      const taskStartDate = new Date(selectedTask.start_datetime);
      const taskEndDate = selectedTask.end_datetime ? new Date(selectedTask.end_datetime) : null;

      const taskStartTime = taskStartDate.toLocaleTimeString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const taskEndTime = taskEndDate ? taskEndDate.toLocaleTimeString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) : '';
      setStartTime(taskStartTime);
      setEndTime(taskEndTime);
      
      // 区分の初期値を設定
      setTransportMethod(selectedTask.transport_method);
      
      // 運送区分の初期値も設定
      if (selectedTask.transport_categories) {
        setTransportCategories({
          aswan: selectedTask.transport_categories.aswan || false,
          charter: selectedTask.transport_categories.charter || false,
          charterCount: selectedTask.transport_categories.charterCount || 1,
          shippingCompany: selectedTask.transport_categories.shippingCompany || false,
          selectedCompany: selectedTask.transport_categories.selectedCompany || '',
          customCompany: selectedTask.transport_categories.customCompany || '',
          branchName: selectedTask.transport_categories.branchName || '',
          noPickup: selectedTask.transport_categories.noPickup || false,
        });
      } else {
        // 運送区分データがない場合は初期値
        setTransportCategories({
          aswan: false,
          charter: false,
          charterCount: 1,
          shippingCompany: false,
          selectedCompany: '',
          customCompany: '',
          branchName: '',
          noPickup: false,
        });
      }
      
      setIsEditMode(true);
    } else {
      alert('この予定を編集する権限がありません。');
    }
  };

  // 予定更新
  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedTask || !canEditTask(selectedTask)) {
      alert('この予定を更新する権限がありません。');
      return;
    }

    // 「人員のみ」選択時の必須バリデーション
    const transportMethodValue = formData.get('transportMethod') as string;
    if (transportMethodValue === '人員のみ' && !hasPartTimer) {
      alert('「人員のみ」を選択した場合、人員情報の入力は必須です。');
      return;
    }

    // 人員時間のバリデーション
    if (hasPartTimer && !formData.get('partTimerDuration')) {
      alert('人員を選択した場合、時間の選択は必須です。');
      return;
    }

    // 時刻バリデーション
    const startTimeValue = formData.get('startTime') as string;
    const endTimeValue = formData.get('endTime') as string;
    const timeValidation = validateTimes(startTimeValue, endTimeValue);
    
    if (!timeValidation.valid) {
      alert(timeValidation.message);
      return;
    }

    // 運送区分詳細バリデーション
    const transportValidation = validateTransportCategories(transportCategories);
    
    if (!transportValidation.valid) {
      alert(transportValidation.message);
      return;
    }

    // M便時間重複チェック（編集時は自分のタスクを除外）
    const editTransportMethodValue = formData.get('transportMethod') as string;
    const editTaskDate = new Date(selectedTask.start_datetime);
    const mBinValidation = await validateMBinTimeConflict(
      editTransportMethodValue,
      editTaskDate,
      startTimeValue,
      endTimeValue,
      selectedTask.id // 自分のタスクIDを除外
    );
    
    if (!mBinValidation.valid) {
      alert(mBinValidation.message);
      return;
    }
    
    console.log('Updating task...', selectedTask.id);
    
    // 既存タスクの日付部分を取得
    const taskDate = new Date(selectedTask.start_datetime);
    
    const updatedTask: Partial<Task> = {
      customer_name: formData.get('customerName') as string,
      site_name: formData.get('siteName') as string,
      site_address: formData.get('siteAddress') as string,
      start_datetime: combineDateTime(taskDate, formData.get('startTime') as string),
      end_datetime: endTimeValue && endTimeValue.trim() ? combineDateTime(taskDate, endTimeValue) : undefined,
      goods_description: formData.get('goodsDescription') as string,
      is_staff_accompanied: formData.get('isStaffAccompanied') === 'on',
      has_part_timer: hasPartTimer,
      part_timer_count: hasPartTimer ? partTimerCount : undefined,
      part_timer_duration: hasPartTimer ? (formData.get('partTimerDuration') as string) || undefined : undefined,
      transport_method: formData.get('transportMethod') as string,
      remarks: (formData.get('remarks') as string) || undefined,
      transport_categories: {
        aswan: transportCategories.aswan,
        charter: transportCategories.charter,
        charterCount: transportCategories.charter ? transportCategories.charterCount : undefined,
        shippingCompany: transportCategories.shippingCompany,
        selectedCompany: transportCategories.shippingCompany ? transportCategories.selectedCompany : undefined,
        customCompany: transportCategories.shippingCompany && transportCategories.selectedCompany === 'その他' ? transportCategories.customCompany : undefined,
        branchName: transportCategories.shippingCompany ? transportCategories.branchName : undefined,
        noPickup: transportCategories.noPickup,
      },
    };

    try {
      const { data: updatedTaskData, error } = await updateTask(selectedTask.id, updatedTask);
      if (error) {
        console.error('Task update error:', error);
        alert('予定の更新に失敗しました。');
      } else {
        await loadTasks(); // データ再読み込み
        setIsEditMode(false);
        closeTaskModal();
        alert('予定を更新しました！');
        
        // 通知送信（エラーが発生してもメイン処理は継続）
        if (updatedTaskData) {
          try {
            await notifyTaskUpdated(updatedTaskData, user?.full_name || 'Unknown User');
          } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error updating task:', error);
      alert('予定の更新中にエラーが発生しました。');
    }
  };


  // 今週の予定件数を計算
  const getWeeklyStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const weeklyTasks = tasks.filter(task => {
      const taskDate = new Date(task.start_datetime);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });

    return {
      total: weeklyTasks.length,
      mBin: weeklyTasks.filter(t => t.transport_method === 'エムワーク便').length,
      otherBin: weeklyTasks.filter(t => t.transport_method === '別便').length,
      staffOnly: weeklyTasks.filter(t => t.transport_method === '人員のみ').length,
    };
  };

  const weeklyStats = getWeeklyStats();

  // 認証状態確認中のロード画面
  if (authLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は何も表示しない（useEffectでリダイレクト処理中）
  if (!user) {
    return null;
  }

  return (
    <MainLayout
      currentUser={{
        name: user?.full_name || 'Unknown User',
        role: user?.role || 'user',
        email: supabaseUser?.email || ''
      }}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* ダッシュボード統計（将来実装） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass p-4 sm:p-6 rounded-lg shadow-elegant hover-lift transition-all-smooth animate-fade-in-up">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full gradient-primary text-white shadow-elegant animate-float">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">今週の予定</h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-300">{weeklyStats.total}件</p>
              </div>
            </div>
          </div>

          <div className="glass p-4 sm:p-6 rounded-lg shadow-elegant hover-lift transition-all-smooth animate-fade-in-up">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full gradient-danger text-white shadow-elegant animate-float">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">エムワーク便</h3>
                <p className="text-xl sm:text-2xl font-bold text-red-300">{weeklyStats.mBin}件</p>
              </div>
            </div>
          </div>

          <div className="glass p-4 sm:p-6 rounded-lg shadow-elegant hover-lift transition-all-smooth animate-fade-in-up">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full gradient-warning text-white shadow-elegant animate-float">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">別便</h3>
                <p className="text-xl sm:text-2xl font-bold text-amber-300">{weeklyStats.otherBin}件</p>
              </div>
            </div>
          </div>

          <div className="glass p-4 sm:p-6 rounded-lg shadow-elegant hover-lift transition-all-smooth animate-fade-in-up">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full gradient-success text-white shadow-elegant animate-float">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">人員のみ</h3>
                <p className="text-xl sm:text-2xl font-bold text-emerald-300">{weeklyStats.staffOnly}件</p>
              </div>
            </div>
          </div>
        </div>

        {/* メインカレンダー */}
        <WeeklyCalendar
          schedules={tasks}
          onScheduleClick={handleTaskClick}
          onNewScheduleClick={handleNewScheduleClick}
          isAdmin={isAdmin}
          onUserManagementClick={() => router.push('/users')}
        />
      </div>

      {/* 予定詳細モーダル */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        title={isEditMode ? "予定の編集" : "予定の詳細"}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            {isEditMode ? (
              // 編集モード
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="customerName"
                    label="得意先名"
                    defaultValue={selectedTask.customer_name}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">開始時間 *</label>
                      <select
                        name="startTime"
                        className="input"
                        required
                        defaultValue={new Date(selectedTask.start_datetime).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false })}
                        onChange={(e) => setStartTime(e.target.value)}
                      >
                        <option value="">選択してください</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                      <select
                        name="endTime"
                        className="input"
                        defaultValue={selectedTask.end_datetime ? new Date(selectedTask.end_datetime).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                        onChange={(e) => setEndTime(e.target.value)}
                      >
                        <option value="">選択してください</option>
                        {generateTimeOptions()
                          .filter(time => !startTime || time > getMinEndTime(startTime))
                          .map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <Input
                  name="siteName"
                  label="現場名"
                  defaultValue={selectedTask.site_name}
                  required
                />
                
                <Input
                  name="siteAddress"
                  label="現場住所"
                  defaultValue={selectedTask.site_address}
                  required
                />
                
                <Input
                  name="goodsDescription"
                  label="搬入商品・数量"
                  defaultValue={selectedTask.goods_description}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                    <input
                      name="staffName"
                      type="text"
                      className="input bg-gray-50"
                      value={user?.full_name || ''}
                      readOnly
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">区分</label>
                    <select 
                      name="transportMethod" 
                      className="input" 
                      defaultValue={selectedTask.transport_method}
                      onChange={(e) => handleTransportMethodChange(e.target.value)}
                    >
                      <option value="エムワーク便">エムワーク便</option>
                      <option value="別便">別便</option>
                      <option value="人員のみ">人員のみ</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input 
                      name="isStaffAccompanied" 
                      type="checkbox" 
                      id="edit-staff-accompany" 
                      className="mr-2"
                      defaultChecked={selectedTask.is_staff_accompanied}
                    />
                    <label htmlFor="edit-staff-accompany" className="text-sm text-gray-700">
                      担当者同行
                    </label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="edit-part-timer" 
                        className="mr-2"
                        checked={hasPartTimer}
                        onChange={(e) => setHasPartTimer(e.target.checked)}
                      />
                      <label htmlFor="edit-part-timer" className="text-sm text-gray-700">
                        人員
                      </label>
                    </div>
                    {hasPartTimer && (
                      <div className="ml-6 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">人数</label>
                          <select 
                            className="input w-32"
                            value={partTimerCount}
                            onChange={(e) => setPartTimerCount(Number(e.target.value))}
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}名
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                          <select
                            name="partTimerDuration"
                            className="input"
                            defaultValue={selectedTask.part_timer_duration || ''}
                            required={hasPartTimer}
                          >
                            <option value="">選択してください</option>
                            <option value="4h">4時間</option>
                            <option value="8h">8時間</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 編集モード：運送区分セクション */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b pb-2">運送区分</h3>
                  <div className="space-y-3">
                    {/* 運送会社選択 */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="edit-shipping-company" 
                          className="mr-3"
                          checked={transportCategories.shippingCompany}
                          onChange={(e) => setTransportCategories(prev => ({
                            ...prev,
                            shippingCompany: e.target.checked
                          }))}
                        />
                        <label htmlFor="edit-shipping-company" className="text-sm text-gray-700">
                          引取り（運送会社等）
                        </label>
                      </div>
                      {transportCategories.shippingCompany && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">運送会社</label>
                            <select 
                              className="input"
                              value={transportCategories.selectedCompany}
                              onChange={(e) => setTransportCategories(prev => ({
                                ...prev,
                                selectedCompany: e.target.value,
                                customCompany: e.target.value === 'その他' ? prev.customCompany : ''
                              }))}
                            >
                              <option value="">選択してください</option>
                              {SHIPPING_COMPANIES.map((company) => (
                                <option key={company} value={company}>
                                  {company}
                                </option>
                              ))}
                            </select>
                          </div>
                          {transportCategories.selectedCompany === 'その他' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">その他引取り場所</label>
                              <input
                                type="text"
                                className="input"
                                placeholder="その他引取り場所を入力"
                                value={transportCategories.customCompany}
                                onChange={(e) => setTransportCategories(prev => ({
                                  ...prev,
                                  customCompany: e.target.value
                                }))}
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">支店名</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="支店名を入力"
                              value={transportCategories.branchName}
                              onChange={(e) => setTransportCategories(prev => ({
                                ...prev,
                                branchName: e.target.value
                              }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* アスワン広島支店 */}
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="edit-aswan-hiroshima" 
                        className="mr-3"
                        checked={transportCategories.aswan}
                        onChange={(e) => setTransportCategories(prev => ({
                          ...prev,
                          aswan: e.target.checked
                        }))}
                      />
                      <label htmlFor="edit-aswan-hiroshima" className="text-sm text-gray-700">
                        引取り（アスワン広島支店）
                      </label>
                    </div>

                    {/* チャーター */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="edit-charter" 
                          className="mr-3"
                          checked={transportCategories.charter}
                          onChange={(e) => setTransportCategories(prev => ({
                            ...prev,
                            charter: e.target.checked
                          }))}
                        />
                        <label htmlFor="edit-charter" className="text-sm text-gray-700">
                          チャーター
                        </label>
                      </div>
                      {transportCategories.charter && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">台数</label>
                          <select 
                            className="input w-32"
                            value={transportCategories.charterCount}
                            onChange={(e) => setTransportCategories(prev => ({
                              ...prev,
                              charterCount: Number(e.target.value)
                            }))}
                          >
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}台
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* 引取り等なし */}
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="edit-no-pickup" 
                        className="mr-3"
                        checked={transportCategories.noPickup}
                        onChange={(e) => setTransportCategories(prev => ({
                          ...prev,
                          noPickup: e.target.checked
                        }))}
                      />
                      <label htmlFor="edit-no-pickup" className="text-sm text-gray-700">
                        引取り等なし
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                  <textarea
                    name="remarks"
                    className="input h-20 resize-none"
                    defaultValue={selectedTask.remarks || ''}
                    placeholder="特記事項があれば入力してください"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="secondary" onClick={() => setIsEditMode(false)}>
                    キャンセル
                  </Button>
                  <Button variant="primary" type="submit">
                    保存
                  </Button>
                </div>
              </form>
            ) : (
              // 表示モード
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">得意先名</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {selectedTask.customer_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {new Date(selectedTask.start_datetime).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })} - {selectedTask.end_datetime ? new Date(selectedTask.end_datetime).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">現場名</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedTask.site_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">現場住所</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedTask.site_address}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">搬入商品・数量</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedTask.goods_description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {selectedTask.users?.full_name || '担当者未設定'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">区分</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {selectedTask.transport_method}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTask.is_staff_accompanied}
                      disabled
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">担当者同行</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTask.has_part_timer}
                      disabled
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">人員</span>
                    {selectedTask.part_timer_count && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({selectedTask.part_timer_count}名
                        {selectedTask.part_timer_duration && ` • ${selectedTask.part_timer_duration}`})
                      </span>
                    )}
                  </div>
                </div>

                {/* 表示モード：運送区分セクション */}
                {selectedTask.transport_categories && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2">運送区分</h3>
                    <div className="space-y-2">
                      {selectedTask.transport_categories.aswan && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">引取り（アスワン広島支店）</span>
                        </div>
                      )}
                      {selectedTask.transport_categories.charter && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">
                            チャーター {selectedTask.transport_categories.charterCount}台
                          </span>
                        </div>
                      )}
                      {selectedTask.transport_categories.shippingCompany && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                          <span className="text-sm text-gray-700">
                            {selectedTask.transport_categories.selectedCompany === 'その他' 
                              ? selectedTask.transport_categories.customCompany 
                              : selectedTask.transport_categories.selectedCompany}{' '}
                            {selectedTask.transport_categories.branchName}支店止め
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTask.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {selectedTask.remarks}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="secondary" onClick={closeTaskModal}>
                    閉じる
                  </Button>
                  {canEditTask(selectedTask) && (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleCreateWorkRequest(selectedTask)}
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                      >
                        📋 依頼書作成
                      </Button>
                      <Button variant="primary" onClick={handleEditTask}>
                        編集
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          if (confirm('この予定を削除しますか？')) {
                            handleDeleteTask();
                          }
                        }}
                      >
                        削除
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 新規予定作成モーダル */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={closeNewTaskModal}
        title={`新規予定作成 - ${selectedDate?.toLocaleDateString('ja-JP')}`}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreateTask}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="customerName"
              label="得意先名"
              placeholder="株式会社サンプル"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始時間 *</label>
                <select
                  name="startTime"
                  className="input"
                  required
                  value={startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    setStartTime(newStartTime);
                    // 開始時間の1時間後を終了時間に設定
                    if (newStartTime) {
                      const [hours, minutes] = newStartTime.split(':').map(Number);
                      const endHour = hours + 1;
                      if (endHour < 24) {
                        const newEndTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        setEndTime(newEndTime);
                      }
                    }
                  }}
                >
                  <option value="">選択してください</option>
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                <select
                  name="endTime"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {generateTimeOptions()
                    .filter(time => !startTime || time > getMinEndTime(startTime))
                    .map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <Input
            name="siteName"
            label="現場名"
            placeholder="本社ビル"
            required
          />

          <Input
            name="siteAddress"
            label="現場住所"
            placeholder="東京都渋谷区..."
            required
          />

          <Input
            name="goodsDescription"
            label="搬入商品・数量"
            placeholder="カーペット 50㎡"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
              <input
                name="staffName"
                type="text"
                className="input bg-gray-50"
                value={user?.full_name || ''}
                readOnly
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区分</label>
              <select 
                name="transportMethod" 
                className="input" 
                defaultValue="エムワーク便"
                onChange={(e) => handleTransportMethodChange(e.target.value)}
              >
                <option value="エムワーク便">エムワーク便</option>
                <option value="別便">別便</option>
                <option value="人員のみ">人員のみ</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input name="isStaffAccompanied" type="checkbox" id="staff-accompany" className="mr-2" />
              <label htmlFor="staff-accompany" className="text-sm text-gray-700">
                担当者同行
              </label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="part-timer" 
                  className="mr-2"
                  checked={hasPartTimer}
                  onChange={(e) => setHasPartTimer(e.target.checked)}
                />
                <label htmlFor="part-timer" className="text-sm text-gray-700">
                  人員
                </label>
              </div>
              {hasPartTimer && (
                <div className="ml-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">人数</label>
                    <select 
                      className="input w-32"
                      value={partTimerCount}
                      onChange={(e) => setPartTimerCount(Number(e.target.value))}
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}名
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">時間</label>
                    <select
                      name="partTimerDuration"
                      className="input"
                      required={hasPartTimer}
                    >
                      <option value="">選択してください</option>
                      <option value="4h">4時間</option>
                      <option value="8h">8時間</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 運送区分セクション */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">運送区分</h3>
            <div className="space-y-3">
              {/* 運送会社選択 */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="shipping-company" 
                    className="mr-3"
                    checked={transportCategories.shippingCompany}
                    onChange={(e) => setTransportCategories(prev => ({
                      ...prev,
                      shippingCompany: e.target.checked
                    }))}
                  />
                  <label htmlFor="shipping-company" className="text-sm text-gray-700">
                    引取り（運送会社等）
                  </label>
                </div>
                {transportCategories.shippingCompany && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">運送会社</label>
                      <select 
                        className="input"
                        value={transportCategories.selectedCompany}
                        onChange={(e) => setTransportCategories(prev => ({
                          ...prev,
                          selectedCompany: e.target.value,
                          customCompany: e.target.value === 'その他' ? prev.customCompany : ''
                        }))}
                      >
                        <option value="">選択してください</option>
                        {SHIPPING_COMPANIES.map((company) => (
                          <option key={company} value={company}>
                            {company}
                          </option>
                        ))}
                      </select>
                    </div>
                    {transportCategories.selectedCompany === 'その他' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">その他引取り場所</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="その他引取り場所を入力"
                          value={transportCategories.customCompany}
                          onChange={(e) => setTransportCategories(prev => ({
                            ...prev,
                            customCompany: e.target.value
                          }))}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">支店名</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="支店名を入力"
                        value={transportCategories.branchName}
                        onChange={(e) => setTransportCategories(prev => ({
                          ...prev,
                          branchName: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* アスワン広島支店止め */}
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="aswan-hiroshima" 
                  className="mr-3"
                  checked={transportCategories.aswan}
                  onChange={(e) => setTransportCategories(prev => ({
                    ...prev,
                    aswan: e.target.checked
                  }))}
                />
                <label htmlFor="aswan-hiroshima" className="text-sm text-gray-700">
                  引取り（アスワン広島支店）
                </label>
              </div>

              {/* チャーター */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="charter" 
                    className="mr-3"
                    checked={transportCategories.charter}
                    onChange={(e) => setTransportCategories(prev => ({
                      ...prev,
                      charter: e.target.checked
                    }))}
                  />
                  <label htmlFor="charter" className="text-sm text-gray-700">
                    チャーター
                  </label>
                </div>
                {transportCategories.charter && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">台数</label>
                    <select 
                      className="input w-32"
                      value={transportCategories.charterCount}
                      onChange={(e) => setTransportCategories(prev => ({
                        ...prev,
                        charterCount: Number(e.target.value)
                      }))}
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}台
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 引取り等なし */}
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="no-pickup" 
                  className="mr-3"
                  checked={transportCategories.noPickup}
                  onChange={(e) => setTransportCategories(prev => ({
                    ...prev,
                    noPickup: e.target.checked
                  }))}
                />
                <label htmlFor="no-pickup" className="text-sm text-gray-700">
                  引取り等なし
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
            <textarea
              name="remarks"
              className="input h-20 resize-none"
              placeholder="特記事項があれば入力してください"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={closeNewTaskModal}>
              キャンセル
            </Button>
            <Button variant="primary" type="submit">
              保存
            </Button>
          </div>
        </form>
      </Modal>

      {/* 依頼書作成モーダル */}
      <WorkRequestModal
        isOpen={isWorkRequestModalOpen}
        onClose={() => setIsWorkRequestModalOpen(false)}
        task={selectedTask}
        onSubmit={handleWorkRequestSubmit}
      />
    </MainLayout>
  );
}