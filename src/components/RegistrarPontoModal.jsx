import { useState } from 'react'
import { X } from 'lucide-react'

export function RegistrarPontoModal({ isOpen, onClose, onRegistrar, loading }) {
  const [tipo, setTipo] = useState('entrada_trabalho')
  const [hora, setHora] = useState('')
  const [descricao, setDescricao] = useState('')

  const opcoesTipo = [
    { value: 'entrada_trabalho', label: 'Entrada' },
    { value: 'saida_trabalho', label: 'Saída' },
    { value: 'pausa', label: 'Pausa/Afastamento' },
    { value: 'retorno', label: 'Retorno' },
  ]

  const handleRegistrar = async () => {
    if (!hora) {
      alert('Informe uma hora')
      return
    }

    const [hh, mm] = hora.split(':')
    const agora = new Date()
    const dataCompleta = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), parseInt(hh), parseInt(mm))

    await onRegistrar({
      tipo,
      hora: dataCompleta.toISOString(),
      descricao: tipo === 'pausa' || tipo === 'retorno' ? descricao : null,
    })

    // Limpar
    setTipo('entrada_trabalho')
    setHora('')
    setDescricao('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white text-lg font-bold">Registrar Ponto</h2>
            <p className="text-gray-400 text-xs">Entrada, saída, pausa ou retorno</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Tipo de Ponto</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {opcoesTipo.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Descrição (apenas para pausa/retorno) */}
          {(tipo === 'pausa' || tipo === 'retorno') && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">Motivo (Opcional)</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Consulta, Reunião, etc"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrar}
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
