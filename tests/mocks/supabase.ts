// Supabase モック
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

// AuthContext モック
export const mockAuthContext = {
  user: null,
  profile: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
  loading: false,
}

// ThemeContext モック
export const mockThemeContext = {
  theme: 'light' as 'light' | 'dark' | 'system',
  resolvedTheme: 'light' as 'light' | 'dark',
  setTheme: jest.fn(),
}

// モック関数のリセット用ヘルパー
export const resetMocks = () => {
  jest.clearAllMocks()
}