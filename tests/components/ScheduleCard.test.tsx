import { render, screen, fireEvent } from '../utils/test-utils'
import { ScheduleCard } from '@/components/ui/ScheduleCard'

const mockProps = {
  time: '09:00 - 17:00',
  customerName: 'テスト株式会社',
  siteName: 'テスト現場',
  siteAddress: '東京都渋谷区テスト1-1-1',
  staffName: 'テスト太郎',
  type: 'm-bin' as const,
}

describe('ScheduleCard Component', () => {
  it('renders all basic information', () => {
    render(<ScheduleCard {...mockProps} />)
    
    expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument()
    expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
    expect(screen.getByText('テスト現場')).toBeInTheDocument()
    expect(screen.getByText('東京都渋谷区テスト1-1-1')).toBeInTheDocument()
    expect(screen.getByText('テスト太郎')).toBeInTheDocument()
  })

  it('displays correct transport type badge', () => {
    const { rerender } = render(<ScheduleCard {...mockProps} type="m-bin" />)
    expect(screen.getByText('M便')).toBeInTheDocument()

    rerender(<ScheduleCard {...mockProps} type="other-bin" />)
    expect(screen.getByText('別便')).toBeInTheDocument()

    rerender(<ScheduleCard {...mockProps} type="staff-only" />)
    expect(screen.getByText('人員のみ')).toBeInTheDocument()
  })

  it('shows staff accompanied icon when specified', () => {
    render(<ScheduleCard {...mockProps} isStaffAccompanied={true} />)
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('shows part timer information when specified', () => {
    render(
      <ScheduleCard 
        {...mockProps} 
        hasPartTimer={true} 
        partTimerCount={3} 
      />
    )
    expect(screen.getByText(/🙋‍♂️/)).toBeInTheDocument()
    expect(screen.getByText(/3名/)).toBeInTheDocument()
  })

  it('displays transport categories information', () => {
    const transportCategories = {
      aswan: true,
      charter: false,
      charterCount: 0,
      shippingCompany: true,
      selectedCompany: 'オカケン',
      customCompany: '',
      branchName: '東京',
      noPickup: false,
    }

    render(
      <ScheduleCard 
        {...mockProps} 
        transportCategories={transportCategories} 
      />
    )

    expect(screen.getByText('引取り場所:')).toBeInTheDocument()
    expect(screen.getByText('オカケン 東京支店止め')).toBeInTheDocument()
    expect(screen.getByText('アスワン広島支店止め')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<ScheduleCard {...mockProps} onClick={handleClick} />)
    
    const cardElement = screen.getByText('09:00 - 17:00').closest('div')
    fireEvent.click(cardElement!)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('displays correct transport type for different types', () => {
    const { rerender } = render(<ScheduleCard {...mockProps} type="m-bin" />)
    expect(screen.getByText('M便')).toBeInTheDocument()

    rerender(<ScheduleCard {...mockProps} type="other-bin" />)
    expect(screen.getByText('別便')).toBeInTheDocument()

    rerender(<ScheduleCard {...mockProps} type="staff-only" />)
    expect(screen.getByText('人員のみ')).toBeInTheDocument()
  })
})