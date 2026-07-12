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
  const [editandoJornada, setEditandoJornada] = useState(false)
  const [jornadaHoras, setJornadaHoras] = useState(8)
  const [jornadaMinutos, setJornadaMinutos] = useState(0)

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

      // Carregar jornada diária
      if (data?.jornada_diaria) {
        setJornadaHoras(data.jornada_diaria.horas ?? 8)
        setJornadaMinutos(data.jornada_diaria.minutos ?? 0)
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

  const salvarJornada = async () => {
    try {
      setSalvando(true)
      const { error } = await supabase
        .from('ponto_users')
        .update({
          jornada_diaria: {
            horas: parseInt(jornadaHoras) || 0,
            minutos: parseInt(jornadaMinutos) || 0,
          },
        })
        .eq('id', user.id)

      if (error) throw error
      setEditandoJornada(false)
      alert('Jornada diária atualizada com sucesso!')
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

  // Dados vindos do Google (via Supabase Auth)
  const fotoGoogle = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  const nomeGoogle =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userData?.full_name ||
    'Usuário'

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
            {fotoGoogle ? (
              <img
                src={fotoGoogle}
                alt={nomeGoogle}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover mx-auto mb-3 shadow-lg shadow-teal-500/30 ring-2 ring-teal-500/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 mx-auto mb-3 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <User className="text-white" size={32} />
              </div>
            )}
            <h2 className="text-white text-lg font-bold mb-1">{nomeGoogle}</h2>
            <p className="text-gray-400 text-xs">{user?.email}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-3 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-700/50">
              <User className="text-teal-400" size={18} />
              <div>
                <p className="text-gray-400 text-xs">Nome Completo</p>
                <p className="text-white text-sm">{nomeGoogle}</p>
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

          <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <div>
                <p className="text-gray-400 text-xs">Jornada Diária de Trabalho</p>
                <p className="text-white text-lg font-mono font-bold">
                  {editandoJornada
                    ? '...'
                    : `${String(jornadaHoras).padStart(2, '0')}:${String(jornadaMinutos).padStart(2, '0')}`}
                </p>
                <p className="text-gray-500 text-[11px] mt-1 leading-snug">
                  💡 Informe apenas as horas de <strong>trabalho</strong>, sem o almoço
                  (o almoço é batido à parte e não conta no banco de horas).
                </p>
              </div>
              {!editandoJornada && (
                <button
                  onClick={() => setEditandoJornada(true)}
                  className="p-2 hover:bg-gray-700 rounded transition"
                >
                  <Edit2 size={18} className="text-teal-400" />
                </button>
              )}
            </div>

            {editandoJornada && (
              <div className="space-y-3 pt-1">
                <p className="text-gray-400 text-xs">
                  Quantas horas de <strong>trabalho</strong> você deve fazer por dia (ex: 8h, 9h).
                  Ex: se você trabalha 9h com 1h15 de almoço batido à parte, informe <strong>9h</strong>
                  (só o trabalho). Se as horas já incluem o almoço, desconte o almoço aqui.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Horas</label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={jornadaHoras}
                      onChange={(e) => setJornadaHoras(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-2">Minutos</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={jornadaMinutos}
                      onChange={(e) => setJornadaMinutos(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={salvarJornada}
                    disabled={salvando}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                  >
                    <Check size={18} />
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditandoJornada(false)}
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
