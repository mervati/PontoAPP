import { useContext, useMemo, useState, useEffect } from 'react'
import { BarChart3, Calendar, Download } from 'lucide-react'
import { PontoContext } from '../contexts/PontoContext'
import { AuthContext } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function Relatorio() {
  const { pontos } = useContext(PontoContext)
  const { user } = useContext(AuthContext)
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [diaSelecionadoInicio, setDiaSelecionadoInicio] = useState(null)
  const [diaSelecionadoFim, setDiaSelecionadoFim] = useState(null)
  const [tempoAtual, setTempoAtual] = useState(new Date())
  const [diasFeriados, setDiasFeriados] = useState([])
  const [bancoInicial, setBancoInicial] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user) {
      fetchDadosUsuario()
    }
  }, [user])

  const fetchDadosUsuario = async () => {
    try {
      const { data } = await supabase
        .from('ponto_users')
        .select('dias_feriados, banco_horas_inicial')
        .eq('id', user.id)
        .single()

      if (data?.dias_feriados) setDiasFeriados(data.dias_feriados)
      if (data?.banco_horas_inicial) setBancoInicial(data.banco_horas_inicial)
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    }
  }

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
    // Se tem seleção (início ou período completo)
    if (diaSelecionadoInicio) {
      const [diaI, mesI, anoI] = diaSelecionadoInicio.split('/').map(Number)
      const dataInicio = new Date(anoI, mesI - 1, diaI)
      dataInicio.setHours(0, 0, 0, 0)

      let dataFim = new Date(dataInicio)
      if (diaSelecionadoFim) {
        const [diaF, mesF, anoF] = diaSelecionadoFim.split('/').map(Number)
        dataFim = new Date(anoF, mesF - 1, diaF)
      }
      dataFim.setHours(23, 59, 59, 999)

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
    }

    // Se não tem seleção, mostra tudo agrupado por mês
    return agruparPorMes()
  }, [pontos, diaSelecionadoInicio, diaSelecionadoFim, tempoAtual])

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
        } else if (entrada && !saida) {
          // Se há entrada mas sem saída, conta até agora
          const tempo = tempoAtual - new Date(entrada.created_at)
          tempoTrabalho += tempo
        }
      })

      totalMs += tempoTrabalho
    })

    const horas = Math.floor(totalMs / (60 * 60 * 1000))
    const minutos = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000))

    return { horas, minutos, dias: Object.keys(pontosPorDia).length, totalMs }
  }

  const formatarHoras = (h, m) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const stats = useMemo(() => {
    const calcularEstatisticas = () => {
    if (pontos.length === 0) return null

    const pontosPorDia = {}
    pontos.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!pontosPorDia[data]) {
        pontosPorDia[data] = []
      }
      pontosPorDia[data].push(ponto)
    })

    const horasPorDia = {}
    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      const pares = [
        { entrada: 'ponto_1_entrada', saida: 'ponto_1_saida', entradaAntiga: 'entrada_trabalho', saidaAntiga: 'saida_trabalho' },
        { entrada: 'ponto_2_entrada', saida: 'ponto_2_saida' },
        { entrada: 'ponto_3_entrada', saida: 'ponto_3_saida' },
      ]

      let tempoTrabalho = 0
      pares.forEach((par) => {
        let entrada = diasPontos.find(p => p.tipo === par.entrada)
        let saida = diasPontos.find(p => p.tipo === par.saida)

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
          // Se há entrada mas sem saída, conta até agora
          const tempo = tempoAtual - new Date(entrada.created_at)
          tempoTrabalho += tempo
        }
      })

      const horas = Math.floor(tempoTrabalho / (60 * 60 * 1000))
      const minutos = Math.floor((tempoTrabalho % (60 * 60 * 1000)) / (60 * 1000))
      horasPorDia[data] = { horas, minutos, total: tempoTrabalho }
    })

    const diasOrdenados = Object.entries(horasPorDia).sort((a, b) => b[1].total - a[1].total)
    const diaComMais = diasOrdenados[0]
    const diaComMenos = diasOrdenados[diasOrdenados.length - 1]

    const totalMs = Object.values(horasPorDia).reduce((sum, h) => sum + h.total, 0)
    const totalHoras = Math.floor(totalMs / (60 * 60 * 1000))
    const totalMinutos = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000))

    const mediaHoras = totalHoras / diasOrdenados.length
    const mediaMinutos = totalMinutos / diasOrdenados.length

    return {
      diaComMais,
      diaComMenos,
      totalHoras,
      totalMinutos,
      mediaHoras: Math.floor(mediaHoras),
      mediaMinutos: Math.floor(mediaMinutos),
      diasTrabalhados: diasOrdenados.length,
    }
    }
    return calcularEstatisticas()
  }, [pontos, tempoAtual])

  const gerarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')

    // Título reflete o período selecionado no calendário
    const titulo = diaSelecionadoInicio && diaSelecionadoFim
      ? `CONTROLE DE PONTO - ${diaSelecionadoInicio} A ${diaSelecionadoFim}`
      : diaSelecionadoInicio
      ? `CONTROLE DE PONTO - ${diaSelecionadoInicio}`
      : `CONTROLE DE PONTO - ${mesCalendario.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}`

    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(titulo, 15, 15)

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

    // Filtrar pontos conforme seleção do calendário
    let pontosFiltrados
    if (diaSelecionadoInicio) {
      const [diaI, mesI, anoI] = diaSelecionadoInicio.split('/').map(Number)
      const dataInicio = new Date(anoI, mesI - 1, diaI)
      dataInicio.setHours(0, 0, 0, 0)

      let dataFim = new Date(dataInicio)
      if (diaSelecionadoFim) {
        const [diaF, mesF, anoF] = diaSelecionadoFim.split('/').map(Number)
        dataFim = new Date(anoF, mesF - 1, diaF)
      }
      dataFim.setHours(23, 59, 59, 999)

      pontosFiltrados = pontos.filter(p => {
        const d = new Date(p.created_at)
        return d >= dataInicio && d <= dataFim
      })
    } else {
      // Sem seleção: mês do calendário
      pontosFiltrados = pontos.filter(p => {
        const d = new Date(p.created_at)
        return d.getMonth() === mesCalendario.getMonth() && d.getFullYear() === mesCalendario.getFullYear()
      })
    }

    // Agrupar por dia
    const pontosPorDia = {}
    pontosFiltrados.forEach((ponto) => {
      const data = new Date(ponto.created_at).toLocaleDateString('pt-BR')
      if (!pontosPorDia[data]) pontosPorDia[data] = []
      pontosPorDia[data].push(ponto)
    })

    const headers = [
      'Data', 'Dia da Semana', 'Entrada 1', 'Saída 1', 'Entrada 2',
      'Saída 2', 'Entrada 3', 'Saída 3', 'Total', 'Meta', 'Saldo',
    ]

    const tableData = []
    let totalHorasMs = 0

    Object.entries(pontosPorDia).forEach(([data, diasPontos]) => {
      const dataObj = new Date(diasPontos[0].created_at)
      const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })
      const diaFeriado = diasFeriados.find(d => d.data === data)

      if (diaFeriado) {
        const tipo = diaFeriado.tipo === 'feriado' ? 'FERIADO' : 'FÉRIAS'
        const justificativa = diaFeriado.justificativa ? ` - ${diaFeriado.justificativa}` : ''
        tableData.push([
          data,
          diaSemana,
          { content: `${tipo}${justificativa}`, colSpan: 6, styles: { halign: 'center', fontStyle: 'italic' } },
          '-', '-', '-',
        ])
      } else {
        let entrada1 = diasPontos.find(p => p.tipo === 'ponto_1_entrada')
        let saida1 = diasPontos.find(p => p.tipo === 'ponto_1_saida')
        let entrada2 = diasPontos.find(p => p.tipo === 'ponto_2_entrada')
        let saida2 = diasPontos.find(p => p.tipo === 'ponto_2_saida')
        let entrada3 = diasPontos.find(p => p.tipo === 'ponto_3_entrada')
        let saida3 = diasPontos.find(p => p.tipo === 'ponto_3_saida')

        if (!entrada1) entrada1 = diasPontos.find(p => p.tipo === 'entrada_trabalho')
        if (!saida1) saida1 = diasPontos.find(p => p.tipo === 'saida_trabalho')

        const formatarHora = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

        let totalTrabalhaoMs = 0
        if (entrada1 && saida1) totalTrabalhaoMs += new Date(saida1.created_at) - new Date(entrada1.created_at)
        if (entrada2 && saida2) totalTrabalhaoMs += new Date(saida2.created_at) - new Date(entrada2.created_at)
        if (entrada3 && saida3) totalTrabalhaoMs += new Date(saida3.created_at) - new Date(entrada3.created_at)

        const horas = Math.floor(totalTrabalhaoMs / (60 * 60 * 1000))
        const minutos = Math.floor((totalTrabalhaoMs % (60 * 60 * 1000)) / (60 * 1000))
        const saldoMs = totalTrabalhaoMs - 8 * 60 * 60 * 1000
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

    // Rodapé com total
    const totalDias = Object.keys(pontosPorDia).length
    const totalHoras = Math.floor(totalHorasMs / (60 * 60 * 1000))
    const totalMinutos = Math.floor((totalHorasMs % (60 * 60 * 1000)) / (60 * 1000))
    const metaMs = 8 * totalDias * 60 * 60 * 1000
    const saldoTotalMs = totalHorasMs - metaMs
    const saldoTotalHoras = Math.floor(Math.abs(saldoTotalMs) / (60 * 60 * 1000))
    const saldoTotalMinutos = Math.floor((Math.abs(saldoTotalMs) % (60 * 60 * 1000)) / (60 * 1000))
    const saldoTotalNegativo = saldoTotalMs < 0

    const footRow = [
      { content: 'Total do Período', colSpan: 8, styles: { halign: 'right' } },
      `${String(totalHoras).padStart(2, '0')}:${String(totalMinutos).padStart(2, '0')}`,
      `${8 * totalDias}:00`,
      `${saldoTotalNegativo ? '-' : '+'}${String(saldoTotalHoras).padStart(2, '0')}:${String(saldoTotalMinutos).padStart(2, '0')}`,
    ]

    autoTable(doc, {
      startY: 38,
      head: [headers],
      body: tableData,
      foot: [footRow],
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', valign: 'middle', cellPadding: 1.5 },
      headStyles: { fillColor: [25, 118, 118], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: 20, halign: 'center' },
      footStyles: { fillColor: [235, 235, 235], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 8, right: 8 },
    })

    const nomeArquivo = `Controle de Ponto - ${titulo.replace('CONTROLE DE PONTO - ', '')}.pdf`
    doc.save(nomeArquivo)
  }

  return (
    <div className="pb-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-0.5">📊 Análise de Horas</p>
            <h1 className="text-2xl font-black">Relatório</h1>
            <p className="text-blue-50 text-xs font-medium mt-1">Resumo de horas por período</p>
          </div>
          {(diaSelecionadoInicio || agruparPorPeriodo.length > 0) && (
            <button
              onClick={gerarPDF}
              className="bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Download size={20} />
              <span className="text-sm font-semibold">PDF</span>
            </button>
          )}
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
              const { horas, minutos, dias, totalMs } = calcularHoras(periodo.pontos)

              const metaMs = 8 * dias * 60 * 60 * 1000
              const diferencaMs = totalMs - metaMs
              const absDiffMs = Math.abs(diferencaMs)
              const diffHoras = Math.floor(absDiffMs / (60 * 60 * 1000))
              const diffMinutos = Math.floor((absDiffMs % (60 * 60 * 1000)) / (60 * 1000))
              const negativo = diferencaMs < 0

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
                        totalMs >= metaMs ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${Math.min((totalMs / metaMs) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Meta */}
                  <p className="text-gray-400 text-xs mt-2">
                    Meta: {8 * dias}h | Diferença:{' '}
                    <span
                      className={
                        totalMs >= metaMs ? 'text-green-400' : 'text-orange-400'
                      }
                    >
                      {negativo ? '-' : '+'}
                      {diffHoras}h{diffMinutos > 0 ? ` ${diffMinutos}m` : ''}
                    </span>
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="bg-gradient-to-br from-teal-500/20 via-cyan-500/15 to-blue-500/20 border border-teal-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-lg">
            <p className="text-teal-200 text-xs font-bold uppercase tracking-widest mb-3">📈 Estatísticas Gerais</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-teal-500/20">
                <p className="text-gray-400 text-xs mb-1">Total Trabalhado</p>
                <p className="text-teal-400 font-mono font-bold text-sm">{formatarHoras(stats.totalHoras, stats.totalMinutos)}</p>
                <p className="text-gray-500 text-xs mt-1">{stats.diasTrabalhados} dia(s)</p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-teal-500/20">
                <p className="text-gray-400 text-xs mb-1">Média Diária</p>
                <p className="text-cyan-400 font-mono font-bold text-sm">{formatarHoras(stats.mediaHoras, stats.mediaMinutos)}</p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-green-500/20">
                <p className="text-gray-400 text-xs mb-1">🏆 Dia com Mais Horas</p>
                <p className="text-green-400 font-mono font-bold text-xs">{stats.diaComMais[0]}</p>
                <p className="text-green-400/70 text-xs">{formatarHoras(stats.diaComMais[1].horas, stats.diaComMais[1].minutos)}</p>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-orange-500/20">
                <p className="text-gray-400 text-xs mb-1">📉 Dia com Menos Horas</p>
                <p className="text-orange-400 font-mono font-bold text-xs">{stats.diaComMenos[0]}</p>
                <p className="text-orange-400/70 text-xs">{formatarHoras(stats.diaComMenos[1].horas, stats.diaComMenos[1].minutos)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
