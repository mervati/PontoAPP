import { createContext, useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'

export const PontoContext = createContext()

export function PontoProvider({ children }) {
  const [pontos, setPontos] = useState([])
  const [loading, setLoading] = useState(false)
  const [ultimoPonto, setUltimoPonto] = useState(null)

  const fetchPontos = useCallback(async (userId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pontos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPontos(data || [])

      if (data && data.length > 0) {
        setUltimoPonto(data[0])
      }
    } catch (error) {
      console.error('Erro ao buscar pontos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarPonto = useCallback(async (userId, tipo) => {
    try {
      const agora = new Date()
      const { data, error } = await supabase
        .from('pontos')
        .insert([{
          user_id: userId,
          tipo,
          hora: agora.toISOString(),
          created_at: agora,
        }])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setUltimoPonto(data[0])
        setPontos([data[0], ...pontos])
      }

      return data?.[0]
    } catch (error) {
      console.error('Erro ao registrar ponto:', error)
      throw error
    }
  }, [pontos])

  const deletarPonto = useCallback(async (pontoId) => {
    try {
      const { error } = await supabase
        .from('pontos')
        .delete()
        .eq('id', pontoId)

      if (error) throw error

      setPontos(pontos.filter(p => p.id !== pontoId))
      if (ultimoPonto?.id === pontoId) {
        setUltimoPonto(pontos.find(p => p.id !== pontoId) || null)
      }

      return true
    } catch (error) {
      console.error('Erro ao deletar ponto:', error)
      throw error
    }
  }, [pontos, ultimoPonto])

  const editarPonto = useCallback(async (pontoId, novaHora) => {
    try {
      const { data, error } = await supabase
        .from('pontos')
        .update({ created_at: novaHora })
        .eq('id', pontoId)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setPontos(pontos.map(p => p.id === pontoId ? data[0] : p))
        if (data[0].id === ultimoPonto?.id) {
          setUltimoPonto(data[0])
        }
      }

      return data?.[0]
    } catch (error) {
      console.error('Erro ao editar ponto:', error)
      throw error
    }
  }, [pontos, ultimoPonto])

  const calcularBancoHoras = useCallback((pontos, bancoInicial = null) => {
    if (!pontos || pontos.length === 0) {
      return bancoInicial || { horas: 0, minutos: 0, negativo: false }
    }

    let totalMs = 0

    const pontosPorDia = {}
    pontos.forEach((ponto) => {
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

        const tempoEsperado = 8 * 60 * 60 * 1000
        totalMs += tempoTrabalho - tempoEsperado
      }
    })

    // Adicionar banco inicial (se houver)
    if (bancoInicial) {
      const bancoMs = (bancoInicial.horas * 60 * 60 * 1000) + (bancoInicial.minutos * 60 * 1000)
      totalMs += bancoInicial.negativo ? -bancoMs : bancoMs
    }

    const horas = Math.floor(Math.abs(totalMs) / (60 * 60 * 1000))
    const minutos = Math.floor((Math.abs(totalMs) % (60 * 60 * 1000)) / (60 * 1000))
    const negativo = totalMs < 0

    return { horas, minutos, negativo }
  }, [])

  return (
    <PontoContext.Provider value={{
      pontos,
      loading,
      ultimoPonto,
      fetchPontos,
      registrarPonto,
      editarPonto,
      deletarPonto,
      calcularBancoHoras,
    }}>
      {children}
    </PontoContext.Provider>
  )
}
