// ==============================================================================
// CONTEXTO DE AUTENTICAÇÃO REAL — FÁCIL CAR SHOP
// Integração direta com Supabase Auth e tabela fcs_profiles
// ==============================================================================

import * as React from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient'
import type { FCSProfile } from '@/types/crm'
import type { UserRole } from '@/components/dashboard/DashboardLayout'

export interface AuthContextType {
  user: User | null
  profile: FCSProfile | null
  session: Session | null
  userRole: UserRole
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<FCSProfile | null>(null)
  const [userRole, setUserRole] = React.useState<UserRole>('LOJISTA')
  const [isLoading, setIsLoading] = React.useState(true)

  // Busca perfil e papel real no banco
  const fetchProfileAndRole = React.useCallback(async (currentUser: User) => {
    if (!supabase) return

    try {
      // 1. Perfil em fcs_profiles
      const { data: profileData } = await supabase
        .from('fcs_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData as FCSProfile)
        if (profileData.role === 'super_admin') {
          setUserRole('SUPER_ADMIN')
          return
        }
      }

      // 2. Papel em fcs_memberships
      const { data: membership } = await supabase
        .from('fcs_memberships')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle()

      if (membership?.role) {
        switch (membership.role) {
          case 'lojista':
            setUserRole('LOJISTA')
            return
          case 'admin_loja':
            setUserRole('ADMIN_LOJA')
            return
          case 'vendedor':
            setUserRole('VENDEDOR_LOJA')
            return
          case 'vendedor_autonomo':
            setUserRole('VENDEDOR')
            return
          default:
            setUserRole('LOJISTA')
            return
        }
      }

      // 3. Verifica se é dono de dealer
      const { data: dealer } = await supabase
        .from('fcs_dealers')
        .select('id')
        .eq('owner_user_id', currentUser.id)
        .maybeSingle()

      if (dealer) {
        setUserRole('LOJISTA')
        return
      }

      // Se não tiver papel configurado, assume LOJISTA padrão para gestão
      setUserRole('LOJISTA')
    } catch (err) {
      console.warn('Erro ao carregar perfil real:', err)
      setUserRole('LOJISTA')
    }
  }, [])

  // Inicialização e escuta da sessão
  React.useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    // Pega sessão atual
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchProfileAndRole(initialSession.user).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Ouve alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        fetchProfileAndRole(newSession.user).finally(() => setIsLoading(false))
      } else {
        setProfile(null)
        setUserRole('LOJISTA')
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfileAndRole])

  // Login com e-mail e senha
  async function signIn(email: string, password: string) {
    if (!supabase) {
      return { error: new Error('Supabase não configurado') }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  // Cadastro com e-mail e senha
  async function signUp(email: string, password: string, fullName: string) {
    if (!supabase) {
      return { error: new Error('Supabase não configurado') }
    }
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error, data }
  }

  // Logout real
  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  // Recuperação de senha
  async function resetPassword(email: string) {
    if (!supabase) {
      return { error: new Error('Supabase não configurado') }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/painel`,
    })
    return { error }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfileAndRole(user)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        userRole,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
