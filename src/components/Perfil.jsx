import { useContext, useState, useEffect } from 'react'
import { LogOut, Mail, User } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

export function Perfil() {
  const { user, logout } = useContext(AuthContext)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserData(data)
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      alert('Erro ao fazer logout: ' + error.message)
    }
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-b from-teal-700 to-teal-800 text-white p-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold mb-2">Perfil</h1>
        <p className="text-teal-100">Suas informações</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 mx-auto mb-4 flex items-center justify-center">
              <User className="text-white" size={40} />
            </div>
            <h2 className="text-white text-xl font-bold mb-1">{userData?.full_name || 'Usuário'}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
              <User className="text-teal-400" size={20} />
              <div>
                <p className="text-gray-400 text-xs">Nome Completo</p>
                <p className="text-white">{userData?.full_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-teal-400" size={20} />
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="text-white text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 space-y-2">
            <p className="text-gray-400 text-xs mb-3">Informações da Conta</p>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Membro desde</span>
              <span className="text-white text-sm">
                {new Date(userData?.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="text-green-400 text-sm">Ativo</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-900 hover:bg-red-800 text-red-200 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut size={20} />
            Fazer Logout
          </button>
        </div>
      )}
    </div>
  )
}
