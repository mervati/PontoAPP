import { Home, Clock, BarChart3, User } from 'lucide-react'

export function Layout({ currentTab, onTabChange, children }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'historico', label: 'Histórico', icon: Clock },
    { id: 'relatorio', label: 'Relatório', icon: BarChart3 },
    { id: 'perfil', label: 'Perfil', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around items-center">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition ${
              currentTab === id
                ? 'text-teal-400 bg-gray-700/50'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
