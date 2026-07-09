import { useContext, useEffect, useState } from 'react'
import { Clock, Coffee, LogOut, LogIn, Plus } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { PontoContext } from '../contexts/PontoContext'
import { supabase } from '../utils/supabase'
import { RegistrarPontoModal } from './RegistrarPontoModal'

export function Dashboard() {
  const { user } = useContext(AuthContext)
  const { ultimoPonto, registrarPonto, fetchPontos, calcularBancoHoras, pontos } = useContext(PontoContext)
  const [bancoInicial, setBancoInicial] = useState(null)
  const [abrirModal, setAbrirModal] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleRegistrarPonto = async (tipo) => {
    try {
      await registrarPonto(user.id, tipo)
    } catch (error) {
      alert('Erro ao registrar ponto: ' + error.message)
    }
  }

  const handleRegistrarPontoManual = async (dados) => {
    try {
      setLoading(true)
      await registrarPonto(user.id, dados.tipo, dados.hora)
      setAbrirModal(false)
    } catch (error) {
      alert('Erro ao registrar ponto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const tiposTexto = {
    entrada_trabalho: 'Entrada',
    entrada_almoco: 'Entrada Almoço',
    saida_almoco: 'Saída Almoço',
    saida_trabalho: 'Saída',
  }

  const proximoTipo = () => {
    const tipos = ['entrada_trabalho', 'entrada_almoco', 'saida_almoco', 'saida_trabalho']
    const hojesPontos = pontos.filter(p => {
      const data = new Date(p.created_at).toLocaleDateString('pt-BR')
      const hoje = new Date().toLocaleDateString('pt-BR')
      return data === hoje
    })

    const registrados = hojesPontos.map(p => p.tipo)
    const proximo = tipos.find(t => !registrados.includes(t))
    return proximo || null
  }

  const banco = calcularBancoHoras(pontos, bancoInicial)
  const proximo = proximoTipo()

  const getPontoPorTipo = (tipo) => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    return pontos.find(p => {
      const data = new Date(p.created_at).toLocaleDateString('pt-BR')
      return data === hoje && p.tipo === tipo
    })
  }

  const formatarHora = (isoString) => {
    const data = new Date(isoString)
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatarBancoHoras = () => {
    const sinal = banco.negativo ? '-' : '+'
    return `${sinal}${String(banco.horas).padStart(2, '0')}:${String(banco.minutos).padStart(2, '0')}`
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
                <p className="text-white font-semibold">{tiposTexto[ultimoPonto.tipo]}</p>
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

        {proximo && (
          <button
            onClick={() => handleRegistrarPonto(proximo)}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-teal-600 hover:to-teal-700 transition"
          >
            {tiposTexto[proximo]}
          </button>
        )}

        {!proximo && (
          <div className="bg-yellow-900/50 text-yellow-300 p-4 rounded-2xl text-sm">
            ✓ Todos os pontos do dia foram registrados
          </div>
        )}

        <button
          onClick={() => setAbrirModal(true)}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
        >
          <Plus size={20} />
          Registrar Ponto Manual
        </button>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <Coffee className="text-orange-400 mx-auto mb-2" size={24} />
            <p className="text-gray-400 text-xs mb-2">Entrada Almoço</p>
            <p className="text-white font-mono">
              {getPontoPorTipo('entrada_almoco') ? formatarHora(getPontoPorTipo('entrada_almoco').created_at) : '--:--'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <LogOut className="text-pink-400 mx-auto mb-2" size={24} />
            <p className="text-gray-400 text-xs mb-2">Saída</p>
            <p className="text-white font-mono">
              {getPontoPorTipo('saida_trabalho') ? formatarHora(getPontoPorTipo('saida_trabalho').created_at) : '--:--'}
            </p>
          </div>
        </div>

        <RegistrarPontoModal
          isOpen={abrirModal}
          onClose={() => setAbrirModal(false)}
          onRegistrar={handleRegistrarPontoManual}
          loading={loading}
        />
      </div>
    </div>
  )
}
