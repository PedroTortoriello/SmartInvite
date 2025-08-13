'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

export default function PublicRSVPPage() {
  const { token } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [companions, setCompanions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const dateLabel = useMemo(() => {
    if (!event?.starts_at) return ''
    try { return new Date(event.starts_at).toLocaleString() } catch { return event.starts_at }
  }, [event?.starts_at])

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/public/rsvp/${token}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Evento não encontrado')
        setEvent(data)
      } catch (e) {
        setError(e.message || 'Falha ao carregar evento')
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchEvent()
  }, [token])

  const addCompanion = () => setCompanions((c) => [...c, ''])
  const removeCompanion = (i) => setCompanions((c) => c.filter((_, idx) => idx !== i))
  const editCompanion = (i, v) => setCompanions((c) => c.map((x, idx) => (idx === i ? v : x)))

  const openInMapsUrl = useMemo(
    () => (event?.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : '#'),
    [event?.location]
  )

  const canSubmit = name.trim().length >= 3 && !submitting

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/public/rsvp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          companions: companions.filter((c) => c.trim().length > 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível confirmar')
      setDone(true)
    } catch (e) {
      setError(e.message || 'Erro ao confirmar presença')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8 border border-gray-200">
        
        {/* Cabeçalho */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">{event?.title ?? (loading ? 'Carregando…' : 'Evento')}</h1>
          <p className="text-gray-500 mt-1">Confirme sua presença</p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-300 mx-auto mt-3 rounded-full" />
        </header>

        {/* Conteúdo */}
        <main>
          {loading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : done ? (
            <div className="text-center space-y-2">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-600">
                  <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-blue-700">Presença confirmada!</h2>
              <p className="text-gray-600">
                Obrigado! {event?.location ? `Nos vemos em ${event.location} ` : ''}no dia {dateLabel}.
              </p>
            </div>
          ) : (
            <>
              {/* Quando */}
              <div className="mb-5">
                <p className="font-semibold text-blue-800">📅 Quando</p>
                <p className="text-gray-700">{dateLabel}</p>
              </div>

              {/* Onde */}
              {event?.location && (
                <div className="mb-6">
                  <p className="font-semibold text-blue-800">📍 Onde</p>
                  <p className="text-gray-700">{event.location}</p>
                  <a
                    href={openInMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Abrir no mapa
                  </a>
                </div>
              )}

              <hr className="my-5 border-gray-300" />

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seu nome <span className="text-gray-400">(obrigatório)</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome e sobrenome"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {/* Acompanhantes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Acompanhantes</label>
                    <button
                      type="button"
                      onClick={addCompanion}
                      className="px-3 py-1 text-sm rounded-full border border-blue-400 text-blue-600 hover:bg-blue-50"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {companions.length > 0 && (
                    <div className="space-y-2">
                      {companions.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={c}
                            onChange={(e) => editCompanion(i, e.target.value)}
                            placeholder={`Acompanhante ${i + 1}`}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeCompanion(i)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Enviando…' : 'Confirmar presença'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
