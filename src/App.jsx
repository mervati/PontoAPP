import { useState, useContext, useEffect } from 'react'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import { PontoProvider } from './contexts/PontoContext'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { Historico } from './components/Historico'
import { Perfil } from './components/Perfil'
import { Layout } from './components/Layout'
import { supabase } from './utils/supabase'

function AppContent() {
  const { user, loading } = useContext(AuthContext)
  const [currentTab, setCurrentTab] = useState('home')

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        })
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'home' && <Dashboard />}
      {currentTab === 'historia' && <Historico />}
      {currentTab === 'perfil' && <Perfil />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PontoProvider>
        <AppContent />
      </PontoProvider>
    </AuthProvider>
  )
}
