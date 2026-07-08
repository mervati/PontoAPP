import { useContext, useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

export function Auth() {
  const { login, register } = useContext(AuthContext)
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.email, form.password, form.fullName)
        setIsLogin(true)
        setForm({ email: '', password: '', fullName: '' })
        alert('Registrado com sucesso! Faça login para continuar.')
      }
    } catch (error) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://pontoapp-psi.vercel.app/',
        },
      })
      if (error) throw error
    } catch (error) {
      alert('Erro ao fazer login com Google: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 mx-auto mb-4 flex items-center justify-center">
            <Clock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PontoAPP</h1>
          <p className="text-gray-400">Gestão Inteligente de Horário</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Faça Login' : 'Crie sua Conta'}
          </h2>

          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="text"
                name="fullName"
                placeholder="Nome Completo"
                value={form.fullName}
                onChange={handleChange}
                required={!isLogin}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Senha"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-teal-700 transition disabled:opacity-50"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Registrar'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Login com Google
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setForm({ email: '', password: '', fullName: '' })
            }}
            className="w-full text-center text-teal-400 hover:text-teal-300 text-sm mt-4"
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça login'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { Clock } from 'lucide-react'
