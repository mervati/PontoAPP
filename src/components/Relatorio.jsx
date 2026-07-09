import { useContext, useMemo, useState } from 'react'
import { BarChart3, Calendar } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'

export function Relatorio() {
  const { pontos } = useContext(PontoContext)
  const [filtro, setFiltro] = useState('mes')

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

  const agruparPorPeriodo = useMemo(() => {
    if (filtro === 'semana') {
      return agruparPorSemana()
    } else {
      return agruparPorMes()
    }
  }, [pontos, filtro])

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
      const tipos = ['entrada_trabalho', 'entrada_almoco', 'saida_almoco', 'saida_trabalho']
      const pcs = tipos.map(t => diasPontos.find(p => p.tipo === t))

      if (pcs[0] && pcs[3]) {
        let tempoTrabalho = new Date(pcs[3].created_at) - new Date(pcs[0].created_at)

        if (pcs[1] && pcs[2]) {
          const tempoAlmoco = new Date(pcs[2].created_at) - new Date(pcs[1].created_at)
          tempoTrabalho -= tempoAlmoco
        }

        totalMs += tempoTrabalho
      }
    })

    const horas = Math.floor(totalMs / (60 * 60 * 1000))
    const minutos = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000))

    return { horas, minutos, dias: Object.keys(pontosPorDia).length }
  }

  const formatarHoras = (h, m) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-b from-teal-700 to-teal-800 text-white p-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold mb-2">Relatório</h1>
        <p className="text-teal-100">Resumo de horas por período</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Filtro de período */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('mes')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              filtro === 'mes'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Calendar size={18} className="inline mr-2" />
            Mês
          </button>
          <button
            onClick={() => setFiltro('semana')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              filtro === 'semana'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Calendar size={18} className="inline mr-2" />
            Semana
          </button>
        </div>

        {/* Lista de períodos */}
        <div className="space-y-3">
          {agruparPorPeriodo.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400">Nenhum ponto registrado ainda</p>
            </div>
          ) : (
            agruparPorPeriodo.map((periodo) => {
              const { horas, minutos, dias } = calcularHoras(periodo.pontos)

              return (
                <div key={periodo.chave} className="bg-gray-800 rounded-2xl p-4">
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
