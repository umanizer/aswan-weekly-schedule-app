import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { act } from 'react'
import { mockAuthContext, mockThemeContext } from '../mocks/supabase'

// シンプルなテスト用プロバイダー（モック済み）
const TestProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-providers">
      {children}
    </div>
  )
}

// テスト用カスタムレンダー（act()でラップして警告を回避）
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  let result: any
  act(() => {
    result = render(ui, { wrapper: TestProviders, ...options })
  })
  return result
}

// モックありのレンダー（プロバイダーをモック化）
export const renderWithMocks = (
  ui: ReactElement,
  {
    authContext = mockAuthContext,
    themeContext = mockThemeContext,
    ...options
  }: {
    authContext?: typeof mockAuthContext
    themeContext?: typeof mockThemeContext
  } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const MockProviders = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">
      {children}
    </div>
  )

  return render(ui, { wrapper: MockProviders, ...options })
}

// よく使うテストデータ
export const mockTask = {
  id: 1,
  user_id: 'test-user-id',
  customer_name: 'テスト株式会社',
  start_datetime: '2025-08-17T09:00:00Z',
  end_datetime: '2025-08-17T17:00:00Z',
  site_name: 'テスト現場',
  site_address: '東京都渋谷区テスト1-1-1',
  goods_description: 'テスト商品 x 10個',
  is_staff_accompanied: true,
  has_part_timer: false,
  part_timer_count: null,
  part_timer_duration: null,
  transport_method: 'M便',
  transport_categories: null,
  remarks: 'テスト備考',
  created_at: '2025-08-17T00:00:00Z',
  users: {
    full_name: 'テスト太郎'
  }
}

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'テスト太郎',
  role: 'user' as const,
  created_at: '2025-08-17T00:00:00Z',
  updated_at: '2025-08-17T00:00:00Z'
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }