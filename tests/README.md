# テスト環境ガイド 🧪

## 📁 フォルダ構成

```
tests/
├── README.md           # このファイル
├── setup.ts           # Jest セットアップ
├── components/        # コンポーネントテスト
│   ├── Button.test.tsx
│   ├── ScheduleCard.test.tsx
│   └── ThemeToggle.test.tsx
├── mocks/             # モックファイル
│   └── supabase.ts
└── utils/             # テストユーティリティ
    ├── test-utils.tsx
    └── utils.test.ts
```

## 🚀 テストコマンド

### 基本的なテスト実行
```bash
# 全テストを実行
npm test

# ウォッチモードで実行（ファイル変更時に自動実行）
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage

# CI環境用（継続的インテグレーション）
npm run test:ci
```

### 特定のテストファイルを実行
```bash
# Button コンポーネントのテストのみ
npm test Button.test.tsx

# components フォルダのテストのみ
npm test tests/components

# パターンマッチで実行
npm test -- --testNamePattern="renders"
```

## 📝 テストの書き方

### 基本的なコンポーネントテスト
```typescript
import { render, screen, fireEvent } from '../utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### モックを使用したテスト
```typescript
import { renderWithMocks } from '../utils/test-utils'
import { mockAuthContext } from '../mocks/supabase'

it('shows user name when authenticated', () => {
  const authContext = {
    ...mockAuthContext,
    user: { id: '1', email: 'test@example.com' },
    profile: { full_name: 'テスト太郎' }
  }

  renderWithMocks(<UserProfile />, { authContext })
  expect(screen.getByText('テスト太郎')).toBeInTheDocument()
})
```

## 🛠️ よく使うテストツール

### Testing Library クエリ
- `getByText()` - テキストで要素を取得
- `getByRole()` - ロール（button, textbox等）で取得
- `getByTestId()` - data-testid で取得
- `queryBy*()` - 要素が存在しない場合をテスト
- `findBy*()` - 非同期要素の取得

### ユーザーイベント
```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()
await user.click(button)
await user.type(input, 'テスト入力')
await user.selectOptions(select, 'option1')
```

### Jest マッチャー
- `toBeInTheDocument()` - 要素がDOM内に存在
- `toHaveClass()` - CSSクラスを持つ
- `toBeDisabled()` - 無効化されている
- `toHaveBeenCalled()` - 関数が呼ばれた
- `toHaveBeenCalledWith()` - 特定の引数で呼ばれた

## 📊 カバレッジレポート

カバレッジレポートは `coverage/` フォルダに生成されます：
- `coverage/lcov-report/index.html` - HTML形式のレポート
- `coverage/lcov.info` - LCOV形式のレポート

## 🎯 テスト戦略

### 優先度の高いテスト
1. **重要なユーザーフロー** - ログイン、予定作成など
2. **ビジネスロジック** - データ変換、バリデーション
3. **エラーハンドリング** - 例外処理、エラー表示

### 優先度の低いテスト
1. **スタイリング** - 見た目のテスト
2. **アニメーション** - 動きのテスト
3. **サードパーティライブラリ** - 外部ライブラリのテスト

## 🚨 トラブルシューティング

### よくあるエラー
1. **モジュールが見つからない** - jest.config.js の moduleNameMapping を確認
2. **DOM要素が見つからない** - 適切な wait* 関数を使用
3. **非同期処理のエラー** - async/await や waitFor を使用

### デバッグ方法
```typescript
// DOM の状態を確認
screen.debug()

// 特定の要素のみ確認
screen.debug(screen.getByRole('button'))

// コンソールログ
console.log(screen.getByText('test').textContent)
```