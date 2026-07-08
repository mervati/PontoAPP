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

  const calcularBancoHoras = useCallback((pontos) => {
    if (!pontos || pontos.length === 0) return { horas: 0, minutos: 0, negativo: false }

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
      calcularBancoHoras,
    }}>
      {children}
    </PontoContext.Provider>
  )
}
