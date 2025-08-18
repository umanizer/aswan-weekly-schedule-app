import { render, screen, fireEvent } from '../utils/test-utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import { mockThemeContext } from '../mocks/supabase'

// ThemeContext のモック
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
}))

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)
    expect(screen.getByTitle('テーマ切り替え')).toBeInTheDocument()
  })

  it('displays current theme information', () => {
    mockThemeContext.theme = 'light'
    mockThemeContext.resolvedTheme = 'light'
    
    render(<ThemeToggle />)
    
    expect(screen.getByText('☀️')).toBeInTheDocument()
    expect(screen.getByText('ライト')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByTitle('テーマ切り替え')
    fireEvent.click(toggleButton)
    
    expect(screen.getAllByText('ライト').length).toBeGreaterThan(0)
    expect(screen.getByText('ダーク')).toBeInTheDocument()
    expect(screen.getByText('システム')).toBeInTheDocument()
  })

  it('calls setTheme when theme option is selected', () => {
    render(<ThemeToggle />)
    
    // ドロップダウンを開く
    fireEvent.click(screen.getByTitle('テーマ切り替え'))
    
    // ダークモードを選択（ドロップダウン内の要素を取得）
    const darkOptions = screen.getAllByText('ダーク')
    const darkDropdownOption = darkOptions.find(option => 
      option.closest('button')?.classList.contains('w-full')
    )
    fireEvent.click(darkDropdownOption!)
    
    expect(mockThemeContext.setTheme).toHaveBeenCalledWith('dark')
  })

  it('shows current resolved theme status', () => {
    mockThemeContext.resolvedTheme = 'dark'
    
    render(<ThemeToggle />)
    
    // ドロップダウンを開く
    fireEvent.click(screen.getByTitle('テーマ切り替え'))
    
    expect(screen.getByText('現在: ダークモード')).toBeInTheDocument()
  })

  it('opens dropdown and shows theme options', () => {
    render(<ThemeToggle />)
    
    // ドロップダウンを開く
    fireEvent.click(screen.getByTitle('テーマ切り替え'))
    
    // 全ての必要なテーマオプションが表示されることを確認
    expect(screen.getByText('ダーク')).toBeInTheDocument()
    expect(screen.getByText('システム')).toBeInTheDocument()
    expect(screen.getByText(/現在:/)).toBeInTheDocument()
  })

  it('highlights currently selected theme', () => {
    mockThemeContext.theme = 'dark'
    
    render(<ThemeToggle />)
    
    // ドロップダウンを開く
    fireEvent.click(screen.getByTitle('テーマ切り替え'))
    
    // ドロップダウン内のダーク要素を取得
    const darkOptions = screen.getAllByText('ダーク')
    const darkDropdownOption = darkOptions.find(option => 
      option.closest('button')?.classList.contains('w-full')
    )?.closest('button')
    
    expect(darkDropdownOption).toHaveClass('bg-blue-100')
  })
})