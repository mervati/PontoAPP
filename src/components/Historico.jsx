import { useContext, useMemo, useState, useEffect, useRef } from 'react'
import { Clock, Coffee, LogOut, LogIn, Edit2, Check, X, Download, Trash2 } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { jsPDF } from 'jspdf'

export function Historico() {
  const { user } = useContext(AuthContext)
  const { pontos, editarPonto, deletarPonto, registrarPonto } = useContext(PontoContext)
  const [editandoId, setEditandoId] = useState(null)
  const [novaHora, setNovaHora] = useState('')
  const [bancoInicial, setBancoInicial] = useState(null)
  const [deletandoId, setDeletandoId] = useState(null)
  const [adicionandoPonto, setAdicionandoPonto] = useState(null)
  const [novoTipo, setNovoTipo] = useState('')
  const [novaHoraPonto, setNovaHoraPonto] = useState('')
  const [diasFeriados, setDiasFeriados] = useState([])
  const [marcandoFeriado, setMarcandoFeriado] = useState(null)
  const [tipoFeriado, setTipoFeriado] = useState('feriado')
  const [justificativa, setJustificativa] = useState('')
  const [tempoAtual, setTempoAtual] = useState(new Date())

  useEffect(() => {
    if (user) {
      fetchBancoInicial()
      fetchDiasFeriados()
    }
  }, [user])

  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editandoId && !event.target.closest('[data-edit-input]')) {
        const pontoEditando = pontos.find(p => p.id === editandoId)
        if (pontoEditando && novaHora) {
          salvarEdicao(pontoEditando)
        } else {
          cancelarEdicao()
        }
      }
    }

    if (editandoId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [editandoId, novaHora, pontos])

  const fetchDiasFeriados = async () => {
    try {
      const { data } = await supabase
        .from('ponto_users')
        .select('dias_feriados')
        .eq('id', user.id)
        .single()

      if (data?.dias_feriados) {
        setDiasFeriados(data.dias_feriados)
      }
    } catch (error) {
      console.error('Erro ao buscar dias feriados:', error)
    }
  }

  const salvarDiaFeriado = async (data, tipo) => {
    try {
      const novosDias = [...diasFeriados]
      const existe = novosDias.findIndex(d => d.data === data)

      if (existe >= 0) {
        novosDias.splice(existe, 1)
      } else {
        novosDias.push({ data, tipo, justificativa })
      }

      const { error } = await supabase
        .from('ponto_users')
        .update({ dias_feriados: novosDias })
        .eq('id', user.id)

      if (error) throw error

      setDiasFeriados(novosDias)
      setMarcandoFeriado(null)
      setTipoFeriado('feriado')
      setJustificativa('')
    } catch (error) {
      alert('Erro ao salvar dia feriado: ' + error.message)
    }
  }

  const isDiaFeriado = (data) => {
    return diasFeriados.some(d => d.data === data)
  }

  const getTipoFeriado = (data) => {
    const dia = diasFeriados.find(d => d.data === data)
    return dia?.tipo || null
  }

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
    pausa: { label: 'Pausa', icon: Coffee, cor: 'text-yellow-400' },
    retorno: { label: 'Retorno', icon: LogIn, cor: 'text-green-400' },
    ponto_1_entrada: { label: 'Entrada', icon: LogIn, cor: 'text-green-400' },
    ponto_1_saida: { label: 'Saída', icon: LogOut, cor: 'text-red-400' },
    ponto_2_entrada: { label: 'Entrada', icon: LogIn, cor: 'text-green-400' },
    ponto_2_saida: { label: 'Saída', icon: LogOut, cor: 'text-red-400' },
    ponto_3_entrada: { label: 'Entrada', icon: LogIn, cor: 'text-green-400' },
    ponto_3_saida: { label: 'Saída', icon: LogOut, cor: 'text-red-400' },
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
    const pares = [
      { entrada: 'ponto_1_entrada', saida: 'ponto_1_saida', entradaAntiga: 'entrada_trabalho', saidaAntiga: 'saida_trabalho' },
      { entrada: 'ponto_2_entrada', saida: 'ponto_2_saida' },
      { entrada: 'ponto_3_entrada', saida: 'ponto_3_saida' },
    ]

    let tempoTrabalho = 0
    let temEntradaAberta = false

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
      } else if (entrada && !saida) {
        // Se há entrada mas sem saída (ainda trabalhando), conta até agora
        temEntradaAberta = true
        const tempo = tempoAtual - new Date(entrada.created_at)
        tempoTrabalho += tempo
      }
    })

    if (tempoTrabalho === 0) return null

    const horas = Math.floor(tempoTrabalho / (60 * 60 * 1000))
    const minutos = Math.floor((tempoTrabalho % (60 * 60 * 1000)) / (60 * 1000))
    const segundos = temEntradaAberta ? Math.floor((tempoTrabalho % (60 * 1000)) / 1000) : 0

    return { horas, minutos, segundos }
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

  const getTiposFaltantes = (diasPontos) => {
    const tiposEsperados = ['ponto_1_entrada', 'ponto_1_saida', 'ponto_2_entrada', 'ponto_2_saida']
    const tiposExistentes = diasPontos.map(p => p.tipo)

    // Fallback para tipos antigos
    const temEntrada1 = tiposExistentes.includes('ponto_1_entrada') || tiposExistentes.includes('entrada_trabalho')
    const temSaida1 = tiposExistentes.includes('ponto_1_saida') || tiposExistentes.includes('saida_trabalho')
    const temEntrada2 = tiposExistentes.includes('ponto_2_entrada')
    const temSaida2 = tiposExistentes.includes('ponto_2_saida')

    const faltantes = []
    if (!temEntrada1) faltantes.push({ tipo: 'ponto_1_entrada', label: 'Entrada 1' })
    if (!temSaida1) faltantes.push({ tipo: 'ponto_1_saida', label: 'Saída 1' })
    if (!temEntrada2) faltantes.push({ tipo: 'ponto_2_entrada', label: 'Entrada 2' })
    if (!temSaida2) faltantes.push({ tipo: 'ponto_2_saida', label: 'Saída 2' })

    return faltantes
  }

  const ehFinDeSemana = (dataStr) => {
    const partes = dataStr.split('/')
    const data = new Date(partes[2], partes[1] - 1, partes[0])
    const dia = data.getDay()
    return dia === 0 || dia === 6 // 0 = domingo, 6 = sábado
  }


  const salvarNovoPonto = async () => {
    if (!novaHoraPonto || !novoTipo) {
      alert('Informe a hora e o tipo de ponto')
      return
    }

    try {
      const [hh, mm] = novaHoraPonto.split(':')
      const data = new Date(adicionandoPonto)
      const dataCompleta = new Date(data.getFullYear(), data.getMonth(), data.getDate(), parseInt(hh), parseInt(mm))

      await registrarPonto(user.id, novoTipo, dataCompleta.toISOString())

      setAdicionandoPonto(null)
      setNovoTipo('')
      setNovaHoraPonto('')
      alert('Ponto adicionado com sucesso!')
    } catch (error) {
      alert('Erro ao adicionar ponto: ' + error.message)
    }
  }

  const exportarPDF = async () => {
    // Buscar dias feriados atualizados
    try {
      const { data } = await supabase
        .from('ponto_users')
        .select('dias_feriados')
        .eq('id', user.id)
        .single()

      if (data?.dias_feriados) {
        setDiasFeriados(data.dias_feriados)
      }
    } catch (error) {
      console.error('Erro ao buscar dias feriados:', error)
    }

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
    const headers = ['Data', 'Dia', 'Ent 1', 'Saí 1', 'Ent 2', 'Saí 2', 'Ent 3', 'Saí 3', 'Total', 'Meta', 'Saldo']
    const colWidths = [16, 10, 10, 10, 10, 10, 10, 10, 11, 11, 11]
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
    let totalHorasMs = 0

    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      const dataObj = new Date(diasPontos[0].created_at)
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' })

      const diaFeriado = diasFeriados.find(d => d.data === data)

      if (diaFeriado) {
        // Se é feriado ou férias, mostrar diferente
        const tipo = diaFeriado.tipo === 'feriado' ? 'FERIADO' : 'FÉRIAS'
        const justificativa = diaFeriado.justificativa ? ` - ${diaFeriado.justificativa}` : ''

        tableData.push([
          data,
          diaSemana,
          `${tipo}${justificativa}`,
          '',
          '',
          '',
          '',
          '',
          '-',
          '-',
          '-',
        ])
      } else {
        // Tentar tipos novos primeiro, depois tipos antigos como fallback
        let entrada1 = diasPontos.find(p => p.tipo === 'ponto_1_entrada')
        let saida1 = diasPontos.find(p => p.tipo === 'ponto_1_saida')
        let entrada2 = diasPontos.find(p => p.tipo === 'ponto_2_entrada')
        let saida2 = diasPontos.find(p => p.tipo === 'ponto_2_saida')
        let entrada3 = diasPontos.find(p => p.tipo === 'ponto_3_entrada')
        let saida3 = diasPontos.find(p => p.tipo === 'ponto_3_saida')

        // Fallback para tipos antigos
        if (!entrada1) entrada1 = diasPontos.find(p => p.tipo === 'entrada_trabalho')
        if (!saida1) saida1 = diasPontos.find(p => p.tipo === 'saida_trabalho')

        const formatarHora = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

        let totalTrabalhaoMs = 0
        if (entrada1 && saida1) {
          let tempo = new Date(saida1.created_at) - new Date(entrada1.created_at)
          totalTrabalhaoMs += tempo
        }
        if (entrada2 && saida2) {
          let tempo = new Date(saida2.created_at) - new Date(entrada2.created_at)
          totalTrabalhaoMs += tempo
        }
        if (entrada3 && saida3) {
          let tempo = new Date(saida3.created_at) - new Date(entrada3.created_at)
          totalTrabalhaoMs += tempo
        }

        const horas = Math.floor(totalTrabalhaoMs / (60 * 60 * 1000))
        const minutos = Math.floor((totalTrabalhaoMs % (60 * 60 * 1000)) / (60 * 1000))
        const totalTrabalhado = horas + minutos / 60

        const tempoEsperadoMs = 8 * 60 * 60 * 1000
        const saldoMs = totalTrabalhaoMs - tempoEsperadoMs
        const saldoHoras = Math.floor(Math.abs(saldoMs) / (60 * 60 * 1000))
        const saldoMinutos = Math.floor((Math.abs(saldoMs) % (60 * 60 * 1000)) / (60 * 1000))
        const saldoNegativo = saldoMs < 0

        totalHorasMs += totalTrabalhaoMs

        tableData.push([
          data,
          diaSemana,
          formatarHora(entrada1?.created_at),
          formatarHora(saida1?.created_at),
          formatarHora(entrada2?.created_at),
          formatarHora(saida2?.created_at),
          formatarHora(entrada3?.created_at),
          formatarHora(saida3?.created_at),
          `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`,
          '8:00',
          `${saldoNegativo ? '-' : '+'}${String(saldoHoras).padStart(2, '0')}:${String(saldoMinutos).padStart(2, '0')}`,
        ])
      }
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

    // Calcular posições das colunas baseado em colWidths
    const totalColWidth = colWidths.reduce((a, b) => a + b, 0)
    const colPositions = []
    let pos = marginLeft
    colWidths.forEach(w => {
      colPositions.push(pos + w / 2)
      pos += w
    })

    const totalHoras = Math.floor(totalHorasMs / (60 * 60 * 1000))
    const totalMinutos = Math.floor((totalHorasMs % (60 * 60 * 1000)) / (60 * 1000))
    const metaHoras = 160
    const saldoTotalMs = totalHorasMs - (metaHoras * 60 * 60 * 1000)
    const saldoTotalHoras = Math.floor(Math.abs(saldoTotalMs) / (60 * 60 * 1000))
    const saldoTotalMinutos = Math.floor((Math.abs(saldoTotalMs) % (60 * 60 * 1000)) / (60 * 1000))
    const saldoTotalNegativo = saldoTotalMs < 0

    doc.text('Total do Mês', colPositions[0], y)
    doc.text(`${String(totalHoras).padStart(2, '0')}:${String(totalMinutos).padStart(2, '0')}`, colPositions[8], y)
    doc.text('160:00', colPositions[9], y)
    doc.text(`${saldoTotalNegativo ? '-' : '+'}${String(saldoTotalHoras).padStart(2, '0')}:${String(saldoTotalMinutos).padStart(2, '0')}`, colPositions[10], y)

    const nomeArquivo = `Controle de Ponto - ${mes}.pdf`
    doc.save(nomeArquivo)
  }

  return (
    <div className="pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-0.5">📋 Seus Registros</p>
              <h1 className="text-2xl font-black">Histórico</h1>
            </div>
            <button
              onClick={exportarPDF}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-1 transition text-sm"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
          <p className="text-purple-50 text-xs font-medium">Acompanhe todos seus pontos</p>
        </div>
      </div>

      <div className="px-3 pt-4 space-y-3">
        {Object.entries(pontosPorDia).map(([data, diasPontos]) => {
          const tempoTotal = calcularDia(diasPontos)
          const tiposFaltantes = getTiposFaltantes(diasPontos)
          const hoje = new Date().toLocaleDateString('pt-BR')
          const ehDiaAnterior = data !== hoje

          return (
            <div key={data} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-4 overflow-hidden backdrop-blur-xl shadow-lg hover:border-slate-600/80 transition-all">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-semibold">{data}</p>
                  {isDiaFeriado(data) && (
                    <p className="text-yellow-400 text-xs mt-1">
                      📌 {getTipoFeriado(data) === 'feriado' ? 'Feriado' : 'Férias'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {tempoTotal && (
                    <p className="text-teal-400 font-mono text-sm">
                      {String(tempoTotal.horas).padStart(2, '0')}:{String(tempoTotal.minutos).padStart(2, '0')}:{String(tempoTotal.segundos).padStart(2, '0')}h
                    </p>
                  )}
                  {tiposFaltantes.length > 0 && ehDiaAnterior && !ehFinDeSemana(data) && !isDiaFeriado(data) && (
                    <button
                      onClick={() => setAdicionandoPonto(data)}
                      className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg transition"
                    >
                      + Adicionar ponto
                    </button>
                  )}
                  {!ehFinDeSemana(data) && (
                    <button
                      onClick={() => setMarcandoFeriado(data)}
                      className={`text-xs px-3 py-1 rounded-lg transition ${
                        isDiaFeriado(data)
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isDiaFeriado(data) ? '✓ ' : ''}Feriado/Férias
                    </button>
                  )}
                </div>
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
                              onClick={(e) => e.stopPropagation()}
                              className="bg-gray-600 text-white text-sm px-3 py-2 rounded mt-1 w-40"
                              data-edit-input
                              autoFocus
                            />
                          ) : (
                            <p className="text-gray-400 text-xs">{formatarHora(ponto.created_at)}</p>
                          )}
                        </div>

                        {editando ? (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                salvarEdicao(ponto)
                              }}
                              className="p-1 bg-teal-600 hover:bg-teal-700 rounded transition"
                            >
                              <Check size={16} className="text-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelarEdicao()
                              }}
                              className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition"
                            >
                              <X size={16} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                iniciarEdicao(ponto)
                              }}
                              className="p-1 hover:bg-gray-600 rounded transition"
                            >
                              <Edit2 size={16} className="text-teal-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletandoId(ponto.id)
                              }}
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

              {adicionandoPonto === data && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
                    <h3 className="text-white font-bold mb-4">Adicionar ponto faltante em {data}</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Tipo de ponto</label>
                        <select
                          value={novoTipo}
                          onChange={(e) => setNovoTipo(e.target.value)}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Selecione o tipo</option>
                          {getTiposFaltantes(diasPontos).map((tipo) => (
                            <option key={tipo.tipo} value={tipo.tipo}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm mb-2">Hora</label>
                        <input
                          type="time"
                          value={novaHoraPonto}
                          onChange={(e) => setNovaHoraPonto(e.target.value)}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => {
                            setAdicionandoPonto(null)
                            setNovoTipo('')
                            setNovaHoraPonto('')
                          }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={salvarNovoPonto}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {marcandoFeriado === data && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
                    <h3 className="text-white font-bold mb-4">
                      {isDiaFeriado(data) ? 'Remover' : 'Marcar'} {data} como...
                    </h3>

                    {!isDiaFeriado(data) ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">Justificativa (opcional)</label>
                          <textarea
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            placeholder="Ex: Médico, Dentista, Luto..."
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                            rows="3"
                          />
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => salvarDiaFeriado(data, 'feriado')}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition"
                          >
                            🏛️ Feriado
                          </button>
                          <button
                            onClick={() => salvarDiaFeriado(data, 'ferias')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                          >
                            🏖️ Férias
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm mb-4">
                          Este dia está marcado como {getTipoFeriado(data)}. Deseja remover?
                        </p>
                        <button
                          onClick={() => salvarDiaFeriado(data, null)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Remover
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setMarcandoFeriado(null)
                        setJustificativa('')
                      }}
                      className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {pontos.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-xl">
              <Clock className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-gray-400 font-semibold">Nenhum ponto registrado ainda</p>
              <p className="text-gray-500 text-sm mt-2">Seus registros aparecerão aqui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
