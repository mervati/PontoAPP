import { useContext, useState, useEffect } from 'react'
import { LogOut, Mail, User, Edit2, Check, X } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'

export function Perfil() {
  const { user, logout } = useContext(AuthContext)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editandoBanco, setEditandoBanco] = useState(false)
  const [bancoHoras, setBancoHoras] = useState(0)
  const [bancoMinutos, setBancoMinutos] = useState(0)
  const [bancoNegativo, setBancoNegativo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('ponto_users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserData(data)

      // Carregar banco inicial
      if (data?.banco_horas_inicial) {
        setBancoHoras(data.banco_horas_inicial.horas || 0)
        setBancoMinutos(data.banco_horas_inicial.minutos || 0)
        setBancoNegativo(data.banco_horas_inicial.negativo || false)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvarBancoInicial = async () => {
    try {
      setSalvando(true)
      const { error } = await supabase
        .from('ponto_users')
        .update({
          banco_horas_inicial: {
            horas: parseInt(bancoHoras) || 0,
            minutos: parseInt(bancoMinutos) || 0,
            negativo: bancoNegativo,
          },
        })
        .eq('id', user.id)

      if (error) throw error
      setEditandoBanco(false)
      alert('Banco de horas inicial atualizado com sucesso!')
      await fetchUserData()
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      alert('Erro ao fazer logout: ' + error.message)
    }
  }

  const formatarBancoInicial = () => {
    const sinal = bancoNegativo ? '-' : '+'
    return `${sinal}${String(bancoHoras).padStart(2, '0')}:${String(bancoMinutos).padStart(2, '0')}`
  }

  return (
    <div className="pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-0.5">👤 Sua Conta</p>
          <h1 className="text-2xl font-black">Perfil</h1>
          <p className="text-indigo-50 text-xs font-medium mt-1">Gerencie suas informações</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      ) : (
        <div className="px-3 pt-4 space-y-3">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-5 text-center backdrop-blur-xl shadow-lg">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mx-auto mb-3 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <User className="text-white" size={32} />
            </div>
            <h2 className="text-white text-lg font-bold mb-1">{userData?.full_name || 'Usuário'}</h2>
            <p className="text-gray-400 text-xs">{user?.email}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-3 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
              <User className="text-teal-400" size={18} />
              <div>
                <p className="text-gray-400 text-xs">Nome Completo</p>
                <p className="text-white text-sm">{userData?.full_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-purple-400" size={18} />
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="text-white text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <div>
                <p className="text-gray-400 text-xs">Banco de Horas Inicial</p>
                <p className="text-white text-lg font-mono font-bold">
                  {editandoBanco ? '...' : formatarBancoInicial()}
                </p>
              </div>
              {!editandoBanco && (
                <button
                  onClick={() => setEditandoBanco(true)}
                  className="p-2 hover:bg-gray-700 rounded transition"
                >
                  <Edit2 size={18} className="text-teal-400" />
                </button>
              )}
            </div>

            {editandoBanco && (
              <div className="space-y-3 pt-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Sinal</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBancoNegativo(false)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition ${
                        !bancoNegativo
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      + (Positivo)
                    </button>
                    <button
                      onClick={() => setBancoNegativo(true)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition ${
                        bancoNegativo
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      - (Negativo)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Horas</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={bancoHoras}
                      onChange={(e) => setBancoHoras(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Minutos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={bancoMinutos}
                      onChange={(e) => setBancoMinutos(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={salvarBancoInicial}
                    disabled={salvando}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                  >
                    <Check size={18} />
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditandoBanco(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
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
