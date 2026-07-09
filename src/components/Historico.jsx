import { useContext, useMemo, useState } from 'react'
import { Clock, Coffee, LogOut, LogIn, Edit2, Check, X } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'

export function Historico() {
  const { pontos, editarPonto } = useContext(PontoContext)
  const [editandoId, setEditandoId] = useState(null)
  const [novaHora, setNovaHora] = useState('')

  const tiposTexto = {
    entrada_trabalho: { label: 'Entrada', icon: LogIn, cor: 'text-green-400' },
    entrada_almoco: { label: 'Entrada Almoço', icon: Coffee, cor: 'text-orange-400' },
    saida_almoco: { label: 'Saída Almoço', icon: LogIn, cor: 'text-yellow-400' },
    saida_trabalho: { label: 'Saída', icon: LogOut, cor: 'text-red-400' },
  }

  const pontosPorDia = useMemo(() => {
    const grupos = {}
    pontos.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!grupos[data]) {
        grupos[data] = []
      }
      grupos[data].push(ponto)
    })
    return grupos
  }, [pontos])

  const calcularDia = (diasPontos) => {
    const tipos = ['entrada_trabalho', 'entrada_almoco', 'saida_almoco', 'saida_trabalho']
    const pcs = tipos.map(t => diasPontos.find(p => p.tipo === t))

    if (!pcs[0] || !pcs[3]) return null

    let tempoTrabalho = new Date(pcs[3].created_at) - new Date(pcs[0].created_at)

    if (pcs[1] && pcs[2]) {
      const tempoAlmoco = new Date(pcs[2].created_at) - new Date(pcs[1].created_at)
      tempoTrabalho -= tempoAlmoco
    }

    const horas = Math.floor(tempoTrabalho / (60 * 60 * 1000))
    const minutos = Math.floor((tempoTrabalho % (60 * 60 * 1000)) / (60 * 1000))

    return { horas, minutos }
  }

  const formatarHora = (isoString) => {
    const data = new Date(isoString)
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const iniciarEdicao = (ponto) => {
    setEditandoId(ponto.id)
    const data = new Date(ponto.created_at)
    const hh = String(data.getHours()).padStart(2, '0')
    const mm = String(data.getMinutes()).padStart(2, '0')
    setNovaHora(`${hh}:${mm}`)
  }

  const salvarEdicao = async (ponto) => {
    try {
      const [hh, mm] = novaHora.split(':')
      const dataBase = new Date(ponto.created_at)
      dataBase.setHours(parseInt(hh), parseInt(mm), 0, 0)

      await editarPonto(ponto.id, dataBase.toISOString())
      setEditandoId(null)
      setNovaHora('')
    } catch (error) {
      alert('Erro ao editar ponto: ' + error.message)
    }
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setNovaHora('')
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-b from-teal-700 to-teal-800 text-white p-6 rounded-b-3xl">
        <h1 className="text-3xl font-bold mb-2">Histórico</h1>
        <p className="text-teal-100">Seus registros de ponto</p>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(pontosPorDia).map(([data, diasPontos]) => {
          const tempoTotal = calcularDia(diasPontos)
          return (
            <div key={data} className="bg-gray-800 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
                <p className="text-white font-semibold">{data}</p>
                {tempoTotal && (
                  <p className="text-teal-400 font-mono text-sm">
                    {String(tempoTotal.horas).padStart(2, '0')}:{String(tempoTotal.minutos).padStart(2, '0')}h
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {diasPontos.map((ponto) => {
                  const tipo = tiposTexto[ponto.tipo]
                  const Icon = tipo.icon
                  const editando = editandoId === ponto.id

                  return (
                    <div key={ponto.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                      <Icon className={`${tipo.cor}`} size={20} />
                      <div className="flex-1">
                        <p className="text-white text-sm">{tipo.label}</p>
                        {editando ? (
                          <input
                            type="time"
                            value={novaHora}
                            onChange={(e) => setNovaHora(e.target.value)}
                            className="bg-gray-600 text-white text-xs px-2 py-1 rounded mt-1 w-20"
                          />
                        ) : (
                          <p className="text-gray-400 text-xs">{formatarHora(ponto.created_at)}</p>
                        )}
                      </div>

                      {editando ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => salvarEdicao(ponto)}
                            className="p-1 bg-teal-600 hover:bg-teal-700 rounded transition"
                          >
                            <Check size={16} className="text-white" />
                          </button>
                          <button
                            onClick={cancelarEdicao}
                            className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarEdicao(ponto)}
                          className="p-1 hover:bg-gray-600 rounded transition"
                        >
                          <Edit2 size={16} className="text-gray-400 hover:text-teal-400" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {pontos.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">Nenhum ponto registrado ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}
