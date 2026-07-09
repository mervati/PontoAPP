import { useContext, useMemo, useState, useEffect } from 'react'
import { Clock, Coffee, LogOut, LogIn, Edit2, Check, X, Download, Trash2 } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { jsPDF } from 'jspdf'

export function Historico() {
  const { user } = useContext(AuthContext)
  const { pontos, editarPonto, deletarPonto } = useContext(PontoContext)
  const [editandoId, setEditandoId] = useState(null)
  const [novaHora, setNovaHora] = useState('')
  const [bancoInicial, setBancoInicial] = useState(null)
  const [deletandoId, setDeletandoId] = useState(null)

  useEffect(() => {
    if (user) {
      fetchBancoInicial()
    }
  }, [user])

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

  const confirmarDelecao = async (pontoId) => {
    try {
      await deletarPonto(pontoId)
      setDeletandoId(null)
      alert('Ponto deletado com sucesso!')
    } catch (error) {
      alert('Erro ao deletar ponto: ' + error.message)
    }
  }

  const exportarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const agora = new Date()
    const mes = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    // Título
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`CONTROLE DE PONTO - ${mes.toUpperCase()}`, 15, 15)

    // Info do banco
    const formatarBanco = (h, m, neg) => {
      const sinal = neg ? '-' : '+'
      return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const bancoAnterior = bancoInicial
      ? formatarBanco(bancoInicial.horas, bancoInicial.minutos, bancoInicial.negativo)
      : '+00:00'

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('Banco de Horas Anterior:', 15, 25)
    doc.text('Jornada Diária Contratual:', 15, 31)

    doc.setFont(undefined, 'bold')
    doc.text(bancoAnterior, 60, 25)
    doc.text('8:00', 60, 31)
    doc.text(`BANCO DE HORAS ACUMULADO: ${bancoAnterior}`, 100, 25)

    // Tabela
    const headers = ['Data', 'Dia', 'Entrada 1', 'Saída Alm.', 'Entrada Alm.', 'Saída 2', 'Total Trab.', 'Carga', 'Saldo']
    const colWidths = [16, 14, 14, 14, 14, 14, 14, 12, 14]
    let y = 42
    const marginLeft = 10

    // Cabeçalho
    doc.setFillColor(25, 118, 118)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(8)

    let x = marginLeft
    headers.forEach((header, i) => {
      doc.rect(x, y, colWidths[i], 6, 'F')
      doc.text(header, x + colWidths[i] / 2, y + 4, { align: 'center' })
      x += colWidths[i]
    })

    // Dados
    const pontosDoMes = pontos.filter(p => {
      const data = new Date(p.created_at)
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear()
    })

    const pontosPorDia = {}
    pontosDoMes.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!pontosPorDia[data]) {
        pontosPorDia[data] = []
      }
      pontosPorDia[data].push(ponto)
    })

    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    y += 6

    const tableData = []
    let totalHoras = 0

    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      const dataObj = new Date(diasPontos[0].created_at)
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })

      const entrada1 = diasPontos.find(p => p.tipo === 'entrada_trabalho')
      const saidaAlmoco = diasPontos.find(p => p.tipo === 'saida_almoco')
      const entradaAlmoco = diasPontos.find(p => p.tipo === 'entrada_almoco')
      const saida2 = diasPontos.find(p => p.tipo === 'saida_trabalho')

      const formatarHora = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

      let totalTrabalhado = 0
      if (entrada1 && saida2) {
        let tempo = new Date(saida2.created_at) - new Date(entrada1.created_at)
        if (entradaAlmoco && saidaAlmoco) {
          const tempoAlmoco = new Date(saidaAlmoco.created_at) - new Date(entradaAlmoco.created_at)
          tempo -= tempoAlmoco
        }
        totalTrabalhado = Math.floor(tempo / (60 * 60 * 1000))
      }

      const saldoDia = totalTrabalhado - 8
      totalHoras += totalTrabalhado

      tableData.push([
        data,
        diaSemana,
        formatarHora(entrada1?.created_at),
        formatarHora(saidaAlmoco?.created_at),
        formatarHora(entradaAlmoco?.created_at),
        formatarHora(saida2?.created_at),
        `${String(totalTrabalhado).padStart(2, '0')}:00`,
        '8:00',
        `${saldoDia >= 0 ? '+' : ''}${String(saldoDia).padStart(2, '0')}:00`,
      ])
    })

    // Desenhar dados
    tableData.forEach((row, idx) => {
      if (y > 270) {
        doc.addPage()
        y = 10
      }

      x = marginLeft
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(x, y, colWidths.reduce((a, b) => a + b), 5, 'F')
      }

      doc.setDrawColor(200, 200, 200)
      doc.rect(x, y, colWidths.reduce((a, b) => a + b), 5)

      row.forEach((cell, i) => {
        doc.text(String(cell), x + colWidths[i] / 2, y + 3.5, { align: 'center' })
        x += colWidths[i]
      })

      y += 5
    })

    // Total
    y += 3
    doc.setFont(undefined, 'bold')
    x = marginLeft
    doc.text('Total do Mês', x + 15, y)
    doc.text(`${String(totalHoras).padStart(2, '0')}:00`, marginLeft + 110, y)
    doc.text('160:00', marginLeft + 130, y)
    doc.text(`${totalHoras >= 160 ? '+' : ''}${String(totalHoras - 160).padStart(2, '0')}:00`, marginLeft + 150, y)

    const nomeArquivo = `Controle de Ponto - ${mes}.pdf`
    doc.save(nomeArquivo)
  }

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-b from-teal-700 to-teal-800 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Histórico</h1>
            <p className="text-teal-100">Seus registros de ponto</p>
          </div>
          <button
            onClick={exportarPDF}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <Download size={20} />
            PDF
          </button>
        </div>
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
                    <div key={ponto.id}>
                      <div className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg group">
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => iniciarEdicao(ponto)}
                              className="p-1 hover:bg-gray-600 rounded transition"
                            >
                              <Edit2 size={16} className="text-teal-400" />
                            </button>
                            <button
                              onClick={() => setDeletandoId(ponto.id)}
                              className="p-1 hover:bg-gray-600 rounded transition"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      {deletandoId === ponto.id && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm">
                            <p className="text-white font-semibold mb-4">Confirmar exclusão?</p>
                            <p className="text-gray-400 text-sm mb-6">
                              Tem certeza que deseja deletar este ponto? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmarDelecao(ponto.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                              >
                                Deletar
                              </button>
                              <button
                                onClick={() => setDeletandoId(null)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
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
