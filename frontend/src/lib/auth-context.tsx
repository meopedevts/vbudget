import {
  createContext,
  createResource,
  useContext,
  type ParentProps,
} from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { authService } from '@/lib/api/auth'
import type { User } from '@/lib/api/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: () => User | undefined
  isLoading: () => boolean
  logout: () => Promise<void>
  refetchUser: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>()

export function AuthProvider(props: ParentProps) {
  const navigate = useNavigate()

  const [user, { refetch }] = createResource<User | undefined>(async () => {
    try {
      return await authService.me()
    } catch {
      navigate('/login', { replace: true })
      return undefined
    }
  })

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: () => user(),
        isLoading: () => user.loading,
        logout,
        refetchUser: refetch,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}


