import { useContext, useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'

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
