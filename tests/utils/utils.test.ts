import { formatDate, cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-08-17')
      const formatted = formatDate(date)
      
      // 日本のロケールでフォーマットされることを確認
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}/)
    })

    it('handles different date formats', () => {
      const date1 = new Date('2025-01-01')
      const date2 = new Date('2025-12-31')
      
      expect(formatDate(date1)).toBeTruthy()
      expect(formatDate(date2)).toBeTruthy()
    })
  })

  describe('cn (className merge)', () => {
    it('merges class names correctly', () => {
      const result = cn('btn', 'btn-primary', 'text-white')
      expect(result).toContain('btn')
      expect(result).toContain('btn-primary')
      expect(result).toContain('text-white')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('btn', isActive && 'active', !isActive && 'inactive')
      
      expect(result).toContain('btn')
      expect(result).toContain('active')
      expect(result).not.toContain('inactive')
    })

    it('handles undefined and null values', () => {
      const result = cn('btn', undefined, null, 'text-white')
      
      expect(result).toContain('btn')
      expect(result).toContain('text-white')
    })

    it('handles empty strings', () => {
      const result = cn('btn', '', 'text-white')
      
      expect(result).toContain('btn')
      expect(result).toContain('text-white')
    })

    it('removes duplicate classes (via tailwind-merge)', () => {
      const result = cn('p-4', 'p-2') // p-2 should override p-4
      
      expect(result).toContain('p-2')
      expect(result).not.toContain('p-4')
    })
  })
})