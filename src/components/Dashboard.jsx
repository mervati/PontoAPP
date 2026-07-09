import { useContext, useEffect, useState } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { PontoContext } from '../contexts/PontoContext'
import { supabase } from '../utils/supabase'

export function Dashboard() {
  const { user } = useContext(AuthContext)
  const { ultimoPonto, registrarPonto, fetchPontos, calcularBancoHoras, pontos } = useContext(PontoContext)
  const [bancoInicial, setBancoInicial] = useState(null)
  const [abrirMenu, setAbrirMenu] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPontos(user.id)
      fetchBancoInicial()
    }
  }, [user, fetchPontos])

  const fetchBancoInicial = async () => {
    try {
      const { data } = await supabase
        .from('ponto_users')
        .select('banco_horas_inicial')
        .eq('id', user.id)
        .single()

      if (data?.banco_horas_inicial) {
        setBancoInicial(data.banco_horas_inicial)
      }
    } catch (error) {
      console.error('Erro ao buscar banco inicial:', error)
    }
  }

  const tiposOpcoes = [
    { icon: LogIn, label: 'Entrada', tipo: 'ponto_1', cor: 'text-green-400' },
    { icon: LogOut, label: 'Saída', tipo: 'ponto_2', cor: 'text-red-400' },
    { icon: LogIn, label: 'Entrada', tipo: 'ponto_3', cor: 'text-green-400' },
    { icon: LogOut, label: 'Saída', tipo: 'ponto_4', cor: 'text-red-400' },
    { icon: LogIn, label: 'Entrada', tipo: 'ponto_5', cor: 'text-green-400' },
    { icon: LogOut, label: 'Saída', tipo: 'ponto_6', cor: 'text-red-400' },
  ]

  const handleRegistrarPonto = async (tipo) => {
    try {
      await registrarPonto(user.id, tipo)
      setAbrirMenu(false)
    } catch (error) {
      alert('Erro ao registrar ponto: ' + error.message)
    }
  }

  const banco = calcularBancoHoras(pontos, bancoInicial)

  const formatarBancoHoras = () => {
    const sinal = banco.negativo ? '-' : '+'
    return `${sinal}${String(banco.horas).padStart(2, '0')}:${String(banco.minutos).padStart(2, '0')}`
  }

  const formatarHora = (isoString) => {
    const data = new Date(isoString)
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-b from-teal-700 to-teal-800 text-white p-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold mb-2">Meu Ponto</h1>
        <p className="text-teal-100">Controle sua jornada</p>
      </div>

      <div className="p-4 space-y-4">
        {ultimoPonto && (
          <div className="bg-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-teal-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Último ponto</p>
                <p className="text-white font-semibold">Ponto {ultimoPonto.tipo.split('_')[1]}</p>
              </div>
            </div>
            <p className="text-teal-400 text-lg font-mono">{formatarHora(ultimoPonto.created_at)}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-400 text-sm">Banco de horas</p>
              <p className={`text-2xl font-bold font-mono ${banco.negativo ? 'text-red-400' : 'text-green-400'}`}>
                {formatarBancoHoras()}
              </p>
            </div>
            {banco.negativo && (
              <div className="text-right text-xs bg-red-900/50 text-red-300 px-3 py-2 rounded-lg">
                Você está devendo
              </div>
            )}
          </div>
        </div>

        {/* Menu de pontos */}
        <div className="relative">
          <button
            onClick={() => setAbrirMenu(!abrirMenu)}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-teal-600 hover:to-teal-700 transition"
          >
            {abrirMenu ? '✕ Fechar' : '+ Bater Ponto'}
          </button>

          {abrirMenu && (
            <div className="absolute top-16 left-0 right-0 bg-gray-800 rounded-2xl p-4 space-y-2 z-50 border border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {tiposOpcoes.map((opcao, idx) => {
                  const Icon = opcao.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleRegistrarPonto(opcao.tipo)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl flex flex-col items-center gap-1 transition"
                    >
                      <Icon className={opcao.cor} size={20} />
                      <span className="text-xs">{opcao.label} {idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
