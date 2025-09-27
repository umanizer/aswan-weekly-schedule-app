'use client';

import { useState } from 'react';
import { Modal, Button, Input } from './ui';
import { Task } from '@/lib/supabase';

interface WorkRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSubmit: (data: WorkRequestFormData) => void;
}

export interface WorkRequestFormData {
  // 集合情報
  meeting_time: string;
  meeting_place: string;

  // 得意先情報
  customer_contact_person: string;
  customer_phone: string;

  // 作業情報
  work_content: string;

  // 持参品情報
  equipment: {
    helmet: boolean;
    safety_belt: boolean;
    safety_shoes: boolean;
    long_sleeve_shirt: boolean;
    lifting_gear: boolean;
    forklift: boolean;
    sling: boolean;
  };
  cart_count: number;
  abacus_count: number;

  // 材料積込み
  material_loading: {
    previous_day: boolean;
    same_day: boolean;
    morning: boolean;
    afternoon: boolean;
  };

  // 追加備考
  additional_remarks: string;
}

export default function WorkRequestModal({ isOpen, onClose, task, onSubmit }: WorkRequestModalProps) {
  // フォーム状態管理
  const [formData, setFormData] = useState<WorkRequestFormData>({
    meeting_time: '',
    meeting_place: task?.site_address || '',
    customer_contact_person: '',
    customer_phone: '',
    work_content: '搬入作業',
    equipment: {
      helmet: true,
      safety_belt: false,
      safety_shoes: true,
      long_sleeve_shirt: true,
      lifting_gear: false,
      forklift: false,
      sling: false,
    },
    cart_count: 0,
    abacus_count: 0,
    material_loading: {
      previous_day: false,
      same_day: false,
      morning: false,
      afternoon: false,
    },
    additional_remarks: '',
  });

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!formData.meeting_time) {
      alert('集合時間を入力してください。');
      return;
    }

    if (!formData.meeting_place) {
      alert('集合場所を入力してください。');
      return;
    }

    onSubmit(formData);
  };

  // 入力値更新
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 持参品更新
  const updateEquipment = (item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [item]: checked
      }
    }));
  };

  // 材料積込み更新
  const updateMaterialLoading = (item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      material_loading: {
        ...prev.material_loading,
        [item]: checked
      }
    }));
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📋 作業依頼書作成 - ${task.customer_name}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 予定情報表示 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">予定情報</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">日時:</span> {new Date(task.start_datetime).toLocaleDateString('ja-JP')}
            </div>
            <div>
              <span className="font-medium">得意先:</span> {task.customer_name}
            </div>
            <div>
              <span className="font-medium">現場名:</span> {task.site_name}
            </div>
            <div>
              <span className="font-medium">運送区分:</span> {task.transport_method}
            </div>
          </div>
        </div>

        {/* 集合情報 */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">集合情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="time"
              label="集合時間"
              value={formData.meeting_time}
              onChange={(e) => updateFormData('meeting_time', e.target.value)}
              required
            />
            <Input
              label="集合場所"
              value={formData.meeting_place}
              onChange={(e) => updateFormData('meeting_place', e.target.value)}
              placeholder="現場住所またはその他の場所"
              required
            />
          </div>
        </div>

        {/* 得意先担当者情報 */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">得意先担当者情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="担当者名"
              value={formData.customer_contact_person}
              onChange={(e) => updateFormData('customer_contact_person', e.target.value)}
              placeholder="山田太郎"
            />
            <Input
              type="tel"
              label="携帯電話番号"
              value={formData.customer_phone}
              onChange={(e) => updateFormData('customer_phone', e.target.value)}
              placeholder="090-1234-5678"
            />
          </div>
        </div>

        {/* 作業内容 */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">作業内容</h3>
          <Input
            label="作業内容"
            value={formData.work_content}
            onChange={(e) => updateFormData('work_content', e.target.value)}
            placeholder="搬入作業"
          />
        </div>

        {/* 持参品 */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">持参品</h3>

          {/* チェックボックス項目 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'helmet', label: 'ヘルメット', default: true },
              { key: 'safety_belt', label: '安全帯', default: false },
              { key: 'safety_shoes', label: '安全靴', default: true },
              { key: 'long_sleeve_shirt', label: '長袖シャツ', default: true },
              { key: 'lifting_gear', label: '玉掛け', default: false },
              { key: 'forklift', label: 'フォーク', default: false },
              { key: 'sling', label: 'スリング', default: false },
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.equipment[item.key as keyof typeof formData.equipment]}
                  onChange={(e) => updateEquipment(item.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>

          {/* 数値入力項目 */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="台車（台）"
              value={formData.cart_count}
              onChange={(e) => updateFormData('cart_count', parseInt(e.target.value) || 0)}
              min="0"
              max="10"
            />
            <Input
              type="number"
              label="ソロバン（本）"
              value={formData.abacus_count}
              onChange={(e) => updateFormData('abacus_count', parseInt(e.target.value) || 0)}
              min="0"
              max="10"
            />
          </div>
        </div>

        {/* 材料積込み */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">材料積込み</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'previous_day', label: '前日' },
              { key: 'same_day', label: '当日' },
              { key: 'morning', label: '午前' },
              { key: 'afternoon', label: '午後' },
            ].map(item => (
              <label key={item.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.material_loading[item.key as keyof typeof formData.material_loading]}
                  onChange={(e) => updateMaterialLoading(item.key, e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 追加備考 */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">追加備考</h3>
          <textarea
            value={formData.additional_remarks}
            onChange={(e) => updateFormData('additional_remarks', e.target.value)}
            placeholder="依頼書に追加したい備考があれば入力してください"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            📋 依頼書作成
          </Button>
        </div>

      </form>
    </Modal>
  );
}