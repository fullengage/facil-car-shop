// ==============================================================================
// PÁGINA DE LOGIN REAL — FÁCIL CAR SHOP
// Rota pública para autenticação de lojistas, administradores e usuários
// ==============================================================================

import { useNavigate, Link } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft } from 'lucide-react'
import * as React from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  // Se já estiver logado, redireciona para o painel
  React.useEffect(() => {
    if (!isLoading && user) {
      navigate('/painel', { replace: true })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-88px)] bg-slate-50 py-12 px-4 flex flex-col justify-center items-center">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-text hover:text-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a vitrine pública
        </Link>
      </div>

      <LoginForm onSuccess={() => navigate('/painel', { replace: true })} />
    </div>
  )
}
