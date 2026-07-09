import { createContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const ensureUserRecord = async (authUser) => {
    if (!authUser) return
    const { data: existing } = await supabase
      .from('ponto_users')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (!existing) {
      await supabase.from('ponto_users').insert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
        created_at: new Date().toISOString(),
      })
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureUserRecord(session.user)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const register = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    await supabase
      .from('ponto_users')
      .insert({
        id: data.user.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      })

    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
