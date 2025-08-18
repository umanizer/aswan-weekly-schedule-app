# デザインシステム - 週間予定管理アプリ

## デザインコンセプト
**「Clean & Professional」**
- 業務で使用するため、視認性と操作性を最優先
- ミニマルでモダンなデザイン
- 直感的な操作が可能なUI/UX

## カラーパレット

### プライマリカラー（メインカラー）
- **Primary 50**: `#eff6ff` - 最も薄いブルー（背景、ホバーなど）
- **Primary 100**: `#dbeafe` - 薄いブルー（セカンダリ背景）
- **Primary 500**: `#3b82f6` - メインブルー（ボタン、リンクなど）
- **Primary 600**: `#2563eb` - 濃いブルー（ホバー状態）
- **Primary 700**: `#1d4ed8` - 最も濃いブルー（アクティブ状態）

### グレースケール（基本色）
- **Gray 50**: `#f9fafb` - ページ背景
- **Gray 100**: `#f3f4f6` - カード背景、区切り線
- **Gray 200**: `#e5e7eb` - ボーダー、区切り線
- **Gray 400**: `#9ca3af` - サブテキスト
- **Gray 600**: `#4b5563` - セカンダリテキスト
- **Gray 900**: `#111827` - メインテキスト

### アクセントカラー（予定の種類別）
- **M便**: `#ef4444` (Red 500) - エムワーク便（赤色背景、カレンダーアイコン）
- **別便**: `#f59e0b` (Amber 500) - チャーター便等（黄色背景、上下矢印アイコン）
- **人員のみ**: `#10b981` (Emerald 500) - 人員派遣のみ（緑色背景、人型アイコン）

### ラベルカラー（予定カード内）
- **時間**: `#2563eb` (Blue 600)
- **得意先名**: `#9333ea` (Purple 600)
- **現場名**: `#059669` (Emerald 600)
- **現場住所**: `#d97706` (Amber 600)
- **担当**: `#4f46e5` (Indigo 600)
- **引取り場所**: `#e11d48` (Rose 600)

### 引取り場所ドットカラー
- **運送会社等**: `#f97316` (Orange 500)
- **アスワン広島支店**: `#3b82f6` (Blue 500)
- **チャーター**: `#10b981` (Green 500)

### ステータスカラー
- **成功**: `#059669` (Emerald 600)
- **警告**: `#d97706` (Amber 600) 
- **エラー**: `#dc2626` (Red 600)
- **情報**: `#2563eb` (Blue 600)

### ユーザー管理カラー
- **管理者役割**: `#9333ea` (Purple 600) - 管理者バッジ背景
- **一般ユーザー役割**: `#059669` (Emerald 600) - 一般ユーザーバッジ背景
- **ユーザーアバター**: `#dbeafe` (Blue 100) - アバター背景

## タイポグラフィ

### フォントファミリー
```css
font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic Medium', 'Meiryo', sans-serif;
```

### フォントサイズ
- **見出し1**: `text-2xl` (24px) - ページタイトル
- **見出し2**: `text-xl` (20px) - セクションタイトル
- **見出し3**: `text-lg` (18px) - カードタイトル
- **本文**: `text-base` (16px) - 通常テキスト
- **キャプション**: `text-sm` (14px) - 補助テキスト
- **小テキスト**: `text-xs` (12px) - ラベル、日付など

## スペーシング
- **基本単位**: 4px (0.25rem)
- **コンポーネント内余白**: 16px (1rem)
- **セクション間**: 32px (2rem)
- **ページ余白**: 24px (1.5rem)

## シャドウ【v2.0更新】
### 基本シャドウ
- **カード**: `shadow-sm` - 軽いシャドウ
- **浮上**: `shadow-md` - 中程度のシャドウ
- **モーダル**: `shadow-xl` - 強いシャドウ

### エレガントシャドウシステム
- **エレガント**: `shadow-elegant` - 標準的な美しいシャドウ
  ```css
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  ```
- **フローティング**: `shadow-floating` - 浮遊効果用のシャドウ
  ```css
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  ```

## ボーダーラディウス
- **小**: `rounded-sm` (2px) - ボタン、入力欄
- **中**: `rounded-md` (6px) - カード
- **大**: `rounded-lg` (8px) - モーダル

## レイアウト原則

### グリッドシステム
- **PC**: 7列グリッド（週間表示）
- **タブレット**: 可変レイアウト
- **スマートフォン**: 1列リスト

### ブレークポイント
- **sm**: 640px以上 - スマートフォン横
- **md**: 768px以上 - タブレット
- **lg**: 1024px以上 - PC
- **xl**: 1280px以上 - 大画面PC

## コンポーネント定義

### ボタン
- **Primary**: 青背景、白文字
- **Secondary**: 白背景、青文字、青ボーダー  
- **Danger**: 赤背景、白文字
- **Ghost**: 背景なし、テキストのみ

### 入力欄
- **高さ**: 40px
- **ボーダー**: Gray 200
- **フォーカス**: Primary 500ボーダー

### カード
- **背景**: 白
- **ボーダー**: なし
- **シャドウ**: shadow-sm
- **ラディウス**: rounded-md

## UI/UX限界突破システム【v2.0新規追加】

### グラスモーフィズム効果
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```
- **適用箇所**: ヘッダー、カレンダーヘッダー、予定カード、ドロップダウンメニュー
- **コントラスト対応**: `bg-white bg-opacity-90-95`で高い視認性を確保

### グラデーションシステム
```css
.gradient-primary { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
.gradient-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.gradient-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.gradient-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
```

### マイクロインタラクション
#### アニメーション
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translate3d(0, 20px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
}
```

#### ホバーエフェクト
```css
.hover-lift:hover { transform: translateY(-2px); }
.btn-hover-scale:hover { transform: scale(1.05); }
.transition-all-smooth { transition: all 0.3s ease-in-out; }
```

### z-index階層管理
- **背景**: z-0
- **ヘッダー**: z-10  
- **ドロップダウン親要素**: z-50
- **ドロップダウンメニュー**: z-9999
- **モバイルオーバーレイ**: z-90

### レスポンシブドロップダウン
- **PC**: `absolute`配置、`w-96`
- **スマホ**: `fixed`配置、`w-[calc(100vw-2rem)]`
- **位置調整**: `top-16 right-4`（スマホ）、`top-auto right-0`（PC）

この設計により、統一感のある美しく未来感のあるインターフェースを実現します。