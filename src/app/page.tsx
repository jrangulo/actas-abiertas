'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEmail } from '@/lib/auth/email-validator'

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router, supabase])

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    setIsLoading(provider)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setIsLoading(null)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('email')
    setMessage(null)

    // Validar email contra dominios desechables (solo en registro)
    if (isSignUp) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        setMessage({ type: 'error', text: emailValidation.error || 'Correo inválido' })
        setIsLoading(null)
        return
      }
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({
          type: 'success',
          text: '¡Revisa tu correo! Te enviamos un enlace para confirmar tu cuenta.',
        })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        window.location.href = '/dashboard'
      }
    }

    setIsLoading(null)
  }

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo/Brand Section */}
        <div className="text-center mb-12 opacity-0 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            Actas Abiertas
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Verificación ciudadana y transparente de las actas electorales de Honduras 2025
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md opacity-0 animate-slide-up delay-200">
          <div className="bg-background rounded-3xl shadow-xl p-8 sm:p-10 border border-border">
            <h2 className="font-display text-2xl font-semibold text-center mb-2">
              {showEmailForm
                ? isSignUp
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'
                : 'Únete a la verificación'}
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              {showEmailForm
                ? 'Ingresa tus datos para continuar'
                : 'Tu voz importa para la democracia'}
            </p>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {!showEmailForm ? (
              <>
                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={isLoading !== null}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background hover:bg-sand transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-foreground">
                      {isLoading === 'google' ? 'Conectando...' : 'Continuar con Google'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleOAuthSignIn('facebook')}
                    disabled={isLoading !== null}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-background hover:bg-sand transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-foreground">
                      {isLoading === 'facebook' ? 'Conectando...' : 'Continuar con Facebook'}
                    </span>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">o</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Email Option */}
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Continuar con correo electrónico
                </button>
              </>
            ) : (
              <>
                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Contraseña
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading !== null}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading === 'email'
                      ? 'Procesando...'
                      : isSignUp
                        ? 'Crear cuenta'
                        : 'Iniciar sesión'}
                  </button>
                </form>

                {/* Toggle Sign Up / Sign In */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:text-primary-dark font-medium transition-colors"
                  >
                    {isSignUp ? 'Inicia sesión' : 'Regístrate'}
                  </button>
                </p>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false)
                    setMessage(null)
                  }}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver a opciones de acceso
                </button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 text-center opacity-0 animate-slide-up delay-400">
            <p className="text-sm text-muted-foreground mb-4">Respaldado por la transparencia</p>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="text-xs">Datos seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <span className="text-xs">Código abierto</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xs">Verificación colectiva</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground opacity-0 animate-slide-up delay-500 space-y-3">
          <p>
            Proyecto de observación ciudadana independiente.{' '}
            <a
              href="https://github.com/jrangulo/actas-abiertas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Ver código fuente
            </a>
          </p>
          <p className="text-xs">
            <a href="/privacidad" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </a>
            {' · '}
            <a href="/terminos" className="hover:text-foreground transition-colors">
              Términos de Servicio
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
