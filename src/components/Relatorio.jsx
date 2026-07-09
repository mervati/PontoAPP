import { useContext, useMemo, useState } from 'react'
import { BarChart3, Calendar } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'

export function Relatorio() {
  const { pontos } = useContext(PontoContext)
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [diaSelecionadoInicio, setDiaSelecionadoInicio] = useState(null)
  const [diaSelecionadoFim, setDiaSelecionadoFim] = useState(null)

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  const getFirstDayOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toLocaleDateString('pt-BR')
  }

  const getLastDayOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? 0 : 7)
    return new Date(d.setDate(diff)).toLocaleDateString('pt-BR')
  }

  const agruparPorSemana = () => {
    const grupos = {}

    pontos.forEach((ponto) => {
      const data = new Date(ponto.created_at)
      const ano = data.getFullYear()
      const semana = getWeekNumber(data)
      const chave = `${ano}-S${semana}`

      if (!grupos[chave]) {
        grupos[chave] = {
          chave,
          label: `Semana ${semana} de ${ano}`,
          dataInicio: getFirstDayOfWeek(data),
          dataFim: getLastDayOfWeek(data),
          pontos: [],
        }
      }
      grupos[chave].pontos.push(ponto)
    })

    return Object.values(grupos).sort((a, b) => {
      if (a.chave !== b.chave) return b.chave.localeCompare(a.chave)
      return 0
    })
  }

  const agruparPorMes = () => {
    const grupos = {}

    pontos.forEach((ponto) => {
      const data = new Date(ponto.created_at)
      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const chave = `${ano}-${mes}`
      const mesNome = new Date(ano, data.getMonth()).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })

      if (!grupos[chave]) {
        grupos[chave] = {
          chave,
          label: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
          pontos: [],
        }
      }
      grupos[chave].pontos.push(ponto)
    })

    return Object.values(grupos).sort((a, b) => b.chave.localeCompare(a.chave))
  }

  const gerarDiasCalendario = () => {
    const ano = mesCalendario.getFullYear()
    const mes = mesCalendario.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const diasMes = ultimoDia.getDate()
    const comecaEm = primeiroDia.getDay()

    const dias = []
    for (let i = 0; i < comecaEm; i++) {
      dias.push(null)
    }
    for (let i = 1; i <= diasMes; i++) {
      dias.push(i)
    }
    return dias
  }

  const getStatusDia = (dia) => {
    const dataStr = `${String(dia).padStart(2, '0')}/${String(mesCalendario.getMonth() + 1).padStart(2, '0')}/${mesCalendario.getFullYear()}`

    const temPontos = Object.entries(pontos).filter(([p]) => {
      return new Date(p.created_at).toLocaleDateString('pt-BR') === dataStr
    })

    if (temPontos.length === 0) return null
    return 'completo'
  }

  const handleSelectDia = (dia) => {
    const dataStr = `${String(dia).padStart(2, '0')}/${String(mesCalendario.getMonth() + 1).padStart(2, '0')}/${mesCalendario.getFullYear()}`

    if (!diaSelecionadoInicio) {
      setDiaSelecionadoInicio(dataStr)
    } else if (!diaSelecionadoFim) {
      setDiaSelecionadoFim(dataStr)
    } else {
      setDiaSelecionadoInicio(dataStr)
      setDiaSelecionadoFim(null)
    }
  }

  const agruparPorPeriodo = useMemo(() => {
    if (!diaSelecionadoInicio || !diaSelecionadoFim) {
      return agruparPorMes()
    }

    // Filtrar pontos pelo período selecionado
    const [diaI, mesI, anoI] = diaSelecionadoInicio.split('/').map(Number)
    const [diaF, mesF, anoF] = diaSelecionadoFim.split('/').map(Number)
    const dataInicio = new Date(anoI, mesI - 1, diaI)
    const dataFim = new Date(anoF, mesF - 1, diaF)

    const pontosFiltrados = pontos.filter(p => {
      const dataPonto = new Date(p.created_at)
      return dataPonto >= dataInicio && dataPonto <= dataFim
    })

    const grupos = {}
    pontosFiltrados.forEach(ponto => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!grupos[data]) {
        grupos[data] = []
      }
      grupos[data].push(ponto)
    })

    return Object.entries(grupos).map(([data, pts]) => ({
      chave: data,
      label: data,
      pontos: pts,
    }))
  }, [pontos, diaSelecionadoInicio, diaSelecionadoFim])

  const calcularHoras = (diasPontos) => {
    let totalMs = 0

    const pontosPorDia = {}
    diasPontos.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!pontosPorDia[data]) {
        pontosPorDia[data] = []
      }
      pontosPorDia[data].push(ponto)
    })

    Object.values(pontosPorDia).forEach((diasPontos) => {
      const pares = [
        { entrada: 'ponto_1_entrada', saida: 'ponto_1_saida', entradaAntiga: 'entrada_trabalho', saidaAntiga: 'saida_trabalho' },
        { entrada: 'ponto_2_entrada', saida: 'ponto_2_saida' },
        { entrada: 'ponto_3_entrada', saida: 'ponto_3_saida' },
      ]

      let tempoTrabalho = 0

      pares.forEach((par) => {
        let entrada = diasPontos.find(p => p.tipo === par.entrada)
        let saida = diasPontos.find(p => p.tipo === par.saida)

        // Fallback para tipos antigos
        if (!entrada && par.entradaAntiga) {
          entrada = diasPontos.find(p => p.tipo === par.entradaAntiga)
        }
        if (!saida && par.saidaAntiga) {
          saida = diasPontos.find(p => p.tipo === par.saidaAntiga)
        }

        if (entrada && saida) {
          const tempo = new Date(saida.created_at) - new Date(entrada.created_at)
          tempoTrabalho += tempo
        }
      })

      totalMs += tempoTrabalho
    })

    const horas = Math.floor(totalMs / (60 * 60 * 1000))
    const minutos = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000))

    return { horas, minutos, dias: Object.keys(pontosPorDia).length }
  }

  const formatarHoras = (h, m) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }


  return (
    <div className="pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-0.5">📊 Análise de Horas</p>
          <h1 className="text-2xl font-black">Relatório</h1>
          <p className="text-blue-50 text-xs font-medium mt-1">Resumo de horas por período</p>
        </div>
      </div>

      <div className="px-3 pt-4 space-y-3">
        {/* Calendário */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMesCalendario(new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() - 1))}
              className="text-teal-400 hover:text-teal-300 font-bold text-lg"
            >
              ←
            </button>
            <p className="text-white font-bold">
              {mesCalendario.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => setMesCalendario(new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1))}
              className="text-teal-400 hover:text-teal-300 font-bold text-lg"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-center mb-3">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(dia => (
              <div key={dia} className="text-gray-400 font-bold py-1">{dia}</div>
            ))}
            {gerarDiasCalendario().map((dia, idx) => {
              if (!dia) return <div key={idx}></div>

              const dataStr = `${String(dia).padStart(2, '0')}/${String(mesCalendario.getMonth() + 1).padStart(2, '0')}/${mesCalendario.getFullYear()}`
              const selecionado = dataStr === diaSelecionadoInicio || dataStr === diaSelecionadoFim
              const estaNoMeio = diaSelecionadoInicio && diaSelecionadoFim &&
                new Date(diaSelecionadoInicio) <= new Date(dataStr) &&
                new Date(dataStr) <= new Date(diaSelecionadoFim)

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectDia(dia)}
                  className={`py-1 rounded text-white text-xs font-semibold transition ${
                    selecionado
                      ? 'bg-teal-600 text-white'
                      : estaNoMeio
                      ? 'bg-teal-500/30 border border-teal-500/50'
                      : 'hover:bg-slate-700/50'
                  }`}
                >
                  {dia}
                </button>
              )
            })}
          </div>

          {(diaSelecionadoInicio || diaSelecionadoFim) && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-teal-300 text-sm font-semibold">
                  {diaSelecionadoInicio && `📍 Início: ${diaSelecionadoInicio}`}
                  {diaSelecionadoFim && ` | Fim: ${diaSelecionadoFim}`}
                  {diaSelecionadoInicio && !diaSelecionadoFim && ' (clique no dia final)'}
                </p>
                <button
                  onClick={() => {
                    setDiaSelecionadoInicio(null)
                    setDiaSelecionadoFim(null)
                  }}
                  className="text-red-400 hover:text-red-300 text-sm font-bold"
                >
                  ✕ Limpar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de períodos */}
        <div className="space-y-3">
          {diaSelecionadoInicio && diaSelecionadoFim && (
            <div className="text-center py-2 px-3 bg-teal-500/20 border border-teal-500/30 rounded-lg">
              <p className="text-teal-300 font-semibold text-sm">
                📊 Período: {diaSelecionadoInicio} a {diaSelecionadoFim}
              </p>
            </div>
          )}

          {agruparPorPeriodo.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl">
                <BarChart3 className="mx-auto text-slate-600 mb-4" size={48} />
                <p className="text-gray-400 font-semibold">Nenhum ponto registrado ainda</p>
              </div>
            </div>
          ) : (
            agruparPorPeriodo.map((periodo) => {
              const { horas, minutos, dias } = calcularHoras(periodo.pontos)

              return (
                <div key={periodo.chave} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-xl shadow-lg hover:border-slate-600/80 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{periodo.label}</p>
                      {periodo.dataInicio && (
                        <p className="text-gray-400 text-xs">
                          {periodo.dataInicio} até {periodo.dataFim}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-teal-400 font-mono text-lg font-bold">
                        {formatarHoras(horas, minutos)}h
                      </p>
                      <p className="text-gray-400 text-xs">{dias} dia(s)</p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        horas >= 8 * dias ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${Math.min(((horas + minutos / 60) / (8 * dias)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Meta */}
                  <p className="text-gray-400 text-xs mt-2">
                    Meta: {8 * dias}h | Diferença:{' '}
                    <span
                      className={
                        horas >= 8 * dias ? 'text-green-400' : 'text-orange-400'
                      }
                    >
                      {horas >= 8 * dias ? '+' : ''}
                      {horas - 8 * dias}h{minutos > 0 ? ` ${minutos}m` : ''}
                    </span>
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
