import { useContext, useMemo, useState, useEffect } from 'react'
import { Clock, Coffee, LogOut, LogIn, Edit2, Check, X, Download } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function Historico() {
  const { user } = useContext(AuthContext)
  const { pontos, editarPonto, calcularBancoHoras } = useContext(PontoContext)
  const [editandoId, setEditandoId] = useState(null)
  const [novaHora, setNovaHora] = useState('')
  const [bancoInicial, setBancoInicial] = useState(null)

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

  const exportarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const agora = new Date()
    const mes = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const mesAno = `${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`

    // Título
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`CONTROLE DE PONTO - ${mes.toUpperCase()}`, 15, 15)

    // Info do banco
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text('Banco de Horas Anterior:', 15, 25)
    doc.text('Jornada Diária Contratual:', 15, 32)
    doc.text('BANCO DE HORAS ACUMULADO:', 100, 25)

    doc.setFont(undefined, 'bold')
    doc.text('2:46', 50, 25)
    doc.text('8:00', 50, 32)
    doc.text('2:46', 150, 25)

    // Tabela
    const tableData = []
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

    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      const dataObj = new Date(diasPontos[0].created_at)
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })

      const entrada1 = diasPontos.find(p => p.tipo === 'entrada_trabalho')
      const saidaAlmoco = diasPontos.find(p => p.tipo === 'saida_almoco')
      const entradaAlmoco = diasPontos.find(p => p.tipo === 'entrada_almoco')
      const saida2 = diasPontos.find(p => p.tipo === 'saida_trabalho')

      const formatarHora = (iso) => {
        if (!iso) return '-'
        return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }

      let totalTrabalhado = 0
      if (entrada1 && saida2) {
        let tempo = new Date(saida2.created_at) - new Date(entrada1.created_at)
        if (entradaAlmoco && saidaAlmoco) {
          const tempoAlmoco = new Date(saidaAlmoco.created_at) - new Date(entradaAlmoco.created_at)
          tempo -= tempoAlmoco
        }
        totalTrabalhado = Math.floor(tempo / (60 * 60 * 1000))
      }

      const cargaDiaria = 8
      const saldoDia = totalTrabalhado - cargaDiaria

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

    doc.autoTable({
      startY: 45,
      head: [['Data', 'Dia da Semana', 'Entrada 1', 'Saída Almoço', 'Entrada Almoço', 'Saída 2', 'Total Trabalhado', 'Carga Diária', 'Saldo do Dia']],
      body: tableData,
      headStyles: { fillColor: [25, 118, 118], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 20 },
        7: { halign: 'center', cellWidth: 18 },
        8: { halign: 'center', cellWidth: 18 },
      },
      margin: { left: 10, right: 10 },
    })

    // Total do mês
    const totalHoras = tableData.reduce((sum, row) => {
      const horas = parseInt(row[6])
      return sum + (isNaN(horas) ? 0 : horas)
    }, 0)

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont(undefined, 'bold')
    doc.text('Total do Mês', 15, finalY)
    doc.text(`${String(totalHoras).padStart(2, '0')}:00`, 80, finalY)
    doc.text('160:00', 110, finalY)
    doc.text(`${totalHoras >= 160 ? '+' : ''}${String(totalHoras - 160).padStart(2, '0')}:00`, 150, finalY)

    // Download
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
