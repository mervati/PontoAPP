import { useContext, useEffect, useState } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { AuthContext } from '../contexts/AuthContext'
import { PontoContext } from '../contexts/PontoContext'
import { supabase } from '../utils/supabase'

export function Dashboard() {
  const { user } = useContext(AuthContext)
  const { ultimoPonto, registrarPonto, fetchPontos, calcularBancoHoras, pontos } = useContext(PontoContext)
  const [bancoInicial, setBancoInicial] = useState(null)

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

  const tiposSequencia = [
    { label: 'Entrada', tipo: 'ponto_1_entrada', icon: LogIn, cor: 'text-green-400' },
    { label: 'Saída', tipo: 'ponto_1_saida', icon: LogOut, cor: 'text-red-400' },
    { label: 'Entrada', tipo: 'ponto_2_entrada', icon: LogIn, cor: 'text-green-400' },
    { label: 'Saída', tipo: 'ponto_2_saida', icon: LogOut, cor: 'text-red-400' },
    { label: 'Entrada', tipo: 'ponto_3_entrada', icon: LogIn, cor: 'text-green-400' },
    { label: 'Saída', tipo: 'ponto_3_saida', icon: LogOut, cor: 'text-red-400' },
  ]

  const getProximoPonto = () => {
    const hojePontos = pontos.filter(p => {
      const data = new Date(p.created_at).toLocaleDateString('pt-BR')
      const hoje = new Date().toLocaleDateString('pt-BR')
      return data === hoje
    })

    const indiceProximo = hojePontos.length
    if (indiceProximo < tiposSequencia.length) {
      return tiposSequencia[indiceProximo]
    }
    return null
  }

  const proximoPonto = getProximoPonto()

  const handleRegistrarPonto = async () => {
    if (!proximoPonto) {
      alert('Todos os 6 pontos do dia já foram registrados')
      return
    }

    try {
      await registrarPonto(user.id, proximoPonto.tipo)
    } catch (error) {
      alert('Erro ao registrar ponto: ' + error.message)
    }
  }

  const ehFinDeSemana = (dataStr) => {
    const partes = dataStr.split('/')
    const data = new Date(partes[2], partes[1] - 1, partes[0])
    const dia = data.getDay()
    return dia === 0 || dia === 6 // 0 = domingo, 6 = sábado
  }

  const verificarDiasIncompletos = () => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    const pontosPorDia = {}
    pontos.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!pontosPorDia[data]) {
        pontosPorDia[data] = []
      }
      pontosPorDia[data].push(ponto)
    })

    const diasIncompletos = []
    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      // Só mostrar avisos para dias anteriores (não para hoje) e apenas dias úteis (seg-sex)
      if (data === hoje || ehFinDeSemana(data)) return

      // Verificar se tem pelo menos entrada1, saida1, entrada2, saida2
      const entrada1 = diasPontos.find(p => p.tipo === 'ponto_1_entrada' || p.tipo === 'entrada_trabalho')
      const saida1 = diasPontos.find(p => p.tipo === 'ponto_1_saida' || p.tipo === 'saida_trabalho')
      const entrada2 = diasPontos.find(p => p.tipo === 'ponto_2_entrada')
      const saida2 = diasPontos.find(p => p.tipo === 'ponto_2_saida')

      if (!entrada1 || !saida1 || !entrada2 || !saida2) {
        diasIncompletos.push(data)
      }
    })

    return diasIncompletos
  }

  const diasIncompletos = verificarDiasIncompletos()

  const calcularResultadoDia = () => {
    const hoje = new Date().toLocaleDateString('pt-BR')

    // Se for fim de semana, não calcula banco de horas
    if (ehFinDeSemana(hoje)) {
      return { horas: 0, minutos: 0, negativo: false }
    }

    const hojePontos = pontos.filter(p => {
      const data = new Date(p.created_at).toLocaleDateString('pt-BR')
      return data === hoje
    })

    const pares = [
      { entrada: 'ponto_1_entrada', saida: 'ponto_1_saida', entradaAntiga: 'entrada_trabalho', saidaAntiga: 'saida_trabalho' },
      { entrada: 'ponto_2_entrada', saida: 'ponto_2_saida' },
      { entrada: 'ponto_3_entrada', saida: 'ponto_3_saida' },
    ]

    let tempoTrabalho = 0
    pares.forEach((par) => {
      let entrada = hojePontos.find(p => p.tipo === par.entrada)
      let saida = hojePontos.find(p => p.tipo === par.saida)

      if (!entrada && par.entradaAntiga) {
        entrada = hojePontos.find(p => p.tipo === par.entradaAntiga)
      }
      if (!saida && par.saidaAntiga) {
        saida = hojePontos.find(p => p.tipo === par.saidaAntiga)
      }

      if (entrada && saida) {
        const tempo = new Date(saida.created_at) - new Date(entrada.created_at)
        tempoTrabalho += tempo
      }
    })

    const tempoEsperado = 8 * 60 * 60 * 1000
    const diffMs = tempoTrabalho - tempoEsperado

    const horas = Math.floor(Math.abs(diffMs) / (60 * 60 * 1000))
    const minutos = Math.floor((Math.abs(diffMs) % (60 * 60 * 1000)) / (60 * 1000))
    const negativo = diffMs < 0

    return { horas, minutos, negativo }
  }

  const resultadoDia = calcularResultadoDia()

  const formatarHoras = (h, m, neg) => {
    const sinal = neg ? '-' : '+'
    return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const formatarHora = (isoString) => {
    const data = new Date(isoString)
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-0.5">📍 Controle de Jornada</p>
              <h1 className="text-2xl font-black">Meu Ponto</h1>
            </div>
            <img
              src="/logo.png"
              alt="Logo PontoAPP"
              className="h-16 w-16 object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-teal-50 text-xs font-medium">Acompanhe suas horas em tempo real</p>
        </div>
      </div>

      <div className="px-3 pt-4 space-y-3">
        {diasIncompletos.length > 0 && (
          <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20 border border-amber-500/50 rounded-xl p-3 backdrop-blur-xl shadow-xl">
            <div className="flex items-start gap-2 mb-2">
              <div className="bg-amber-500/30 rounded-full p-1 mt-0.5">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-amber-200 font-bold text-sm">Dias Incompletos</p>
                <p className="text-amber-100/80 text-xs">Faltam pontos registrados</p>
              </div>
            </div>
            <div className="space-y-1 mb-2">
              {diasIncompletos.map(data => (
                <div key={data} className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-amber-500/20 hover:border-amber-500/50 transition-all">
                  <p className="text-amber-100 text-xs font-semibold">📅 {data}</p>
                </div>
              ))}
            </div>
            <p className="text-amber-200/70 text-xs flex items-center gap-1">
              <span>→</span> Acesse o Histórico para completar
            </p>
          </div>
        )}

        {ultimoPonto && (
          <div className="space-y-2">
            <div className="group bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-blue-500/15 border border-teal-500/40 rounded-2xl p-3 backdrop-blur-xl shadow-2xl hover:border-teal-500/60 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-teal-200/70 text-xs font-bold uppercase tracking-widest mb-1">⏰ Último Ponto</p>
                  <p className="text-white font-bold text-base">Ponto {ultimoPonto.tipo.split('_')[1]}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg p-2 shadow-lg group-hover:shadow-teal-500/50 transition-all">
                  <Clock className="text-white" size={18} />
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-600/40 to-cyan-600/40 border border-teal-500/30 rounded-lg p-2 text-center backdrop-blur-md">
                <p className="text-teal-200/60 text-xs font-semibold mb-0.5">Horário</p>
                <p className="text-white text-2xl font-mono font-black">{formatarHora(ultimoPonto.created_at)}</p>
              </div>
            </div>

            {proximoPonto ? (
              <button
                onClick={handleRegistrarPonto}
                className="group w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 text-white py-3 rounded-2xl font-black text-base hover:from-teal-600 hover:via-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-teal-500/40 hover:shadow-teal-500/70 active:scale-95 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <proximoPonto.icon size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="relative">{proximoPonto.label}</span>
              </button>
            ) : (
              <div className="bg-gradient-to-r from-green-500/25 via-emerald-500/20 to-green-500/25 border border-green-500/50 text-green-300 p-3 rounded-2xl text-center font-bold backdrop-blur-xl shadow-xl">
                <p className="text-lg mb-1">✅</p>
                <p className="text-sm">Todos os 6 pontos foram registrados</p>
                <p className="text-green-400/60 text-xs mt-1">Retorne amanhã para continuar</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-2 px-1">📊 Resultado do Dia</p>
          <div className={`rounded-2xl p-3 border backdrop-blur-xl shadow-xl transition-all ${
            resultadoDia.negativo
              ? 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/40'
              : 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/40'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
              resultadoDia.negativo ? 'text-red-300/80' : 'text-green-300/80'
            }`}>
              {resultadoDia.negativo ? '⚠️ Débito' : '✅ Crédito'}
            </p>
            <p className={`text-3xl font-black font-mono mb-1 ${
              resultadoDia.negativo ? 'text-red-400' : 'text-green-400'
            }`}>
              {formatarHoras(resultadoDia.horas, resultadoDia.minutos, resultadoDia.negativo)}
            </p>
            <p className="text-gray-400 text-xs">Horas trabalhadas − 8 horas esperadas</p>
          </div>
        </div>

        <div className={`group rounded-2xl p-3 border backdrop-blur-xl shadow-xl transition-all mt-3 ${
          bancoInicial?.negativo
            ? 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/40'
            : 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/40'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                bancoInicial?.negativo ? 'text-red-300/80' : 'text-purple-300/80'
              }`}>
                💰 Saldo Anterior
              </p>
              <p className={`text-3xl font-black font-mono ${
                bancoInicial?.negativo ? 'text-red-400' : 'text-purple-300'
              }`}>
                {formatarHoras(bancoInicial?.horas || 0, bancoInicial?.minutos || 0, bancoInicial?.negativo || false)}
              </p>
              <p className="text-gray-400 text-xs mt-1">Atualiza no próximo dia</p>
            </div>
            {bancoInicial?.negativo && (
              <div className="bg-red-500/30 border border-red-500/50 text-red-200 px-2 py-1 rounded-lg text-xs font-bold">
                ⚠️ Devendo
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
