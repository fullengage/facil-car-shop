// ==============================================================================
// FORMULÁRIO DE ACESSO REAL — FÁCIL CAR SHOP
// Autenticação oficial com Supabase Auth (Login, Cadastro e Recuperação de Senha)
// ==============================================================================

import * as React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
}

type TabMode = 'login' | 'register' | 'forgot'

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, signUp, resetPassword } = useAuth()

  const [mode, setMode] = React.useState<TabMode>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  function resetState() {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  function handleModeChange(newMode: TabMode) {
    resetState()
    setMode(newMode)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    resetState()

    if (!email.trim()) {
      setErrorMessage('Informe seu e-mail.')
      return
    }

    if (mode !== 'forgot' && !password) {
      setErrorMessage('Informe sua senha.')
      return
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMessage('Informe seu nome completo.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('E-mail ou senha incorretos.')
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMessage('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
          } else {
            setErrorMessage(error.message || 'Erro ao realizar login.')
          }
          return
        }
        if (onSuccess) onSuccess()
      } else if (mode === 'register') {
        const { error } = await signUp(email.trim(), password, fullName.trim())
        if (error) {
          if (error.message.includes('User already registered')) {
            setErrorMessage('Este e-mail já está cadastrado. Tente entrar.')
          } else if (error.message.includes('Password should be at least')) {
            setErrorMessage('A senha deve conter no mínimo 6 caracteres.')
          } else {
            setErrorMessage(error.message || 'Erro ao cadastrar usuário.')
          }
          return
        }
        setSuccessMessage('Conta criada com sucesso! Faça login com suas credenciais.')
        setMode('login')
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim())
        if (error) {
          setErrorMessage(error.message || 'Erro ao enviar e-mail de recuperação.')
          return
        }
        setSuccessMessage('Enviamos instruções de recuperação para o seu e-mail.')
      }
    } catch (err: unknown) {
      const errObj = err as Error
      setErrorMessage(errObj.message || 'Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-border">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-dark">
          {mode === 'login' && 'Acesso ao Painel'}
          {mode === 'register' && 'Cadastrar Nova Conta'}
          {mode === 'forgot' && 'Recuperar Senha'}
        </h1>
        <p className="mt-2 text-sm text-text">
          {mode === 'login' && 'Entre com seu e-mail e senha para gerenciar suas lojas e veículos.'}
          {mode === 'register' && 'Crie sua conta para publicar e gerenciar veículos no Fácil Car Shop.'}
          {mode === 'forgot' && 'Digite seu e-mail para receber as instruções de recuperação.'}
        </p>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome ou razão social"
                className="w-full rounded-lg border border-border bg-slate-50 pl-11 pr-4 py-3 text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com.br"
              className="w-full rounded-lg border border-border bg-slate-50 pl-11 pr-4 py-3 text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text">
                Senha
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-slate-50 pl-11 pr-11 py-3 text-sm text-dark placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-md hover:bg-dark transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {mode === 'login' && 'Entrar no Painel'}
              {mode === 'register' && 'Concluir Cadastro'}
              {mode === 'forgot' && 'Enviar Instruções'}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Alternância entre Abas */}
      <div className="mt-8 border-t border-border pt-6 text-center text-sm text-text">
        {mode === 'login' && (
          <p>
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className="font-semibold text-primary hover:underline"
            >
              Cadastre-se gratuitamente
            </button>
          </p>
        )}
        {mode === 'register' && (
          <p>
            Já possui uma conta?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="font-semibold text-primary hover:underline"
            >
              Fazer Login
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className="font-semibold text-primary hover:underline"
          >
            ← Voltar para o Login
          </button>
        )}
      </div>
    </div>
  )
}
