// pages/eventos/criar.jsx
'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select as ShadSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Plus, 
  Send, 
  User,
  LogOut,
  MapPin,
  Clock,
  Phone,
  Mail,
  Tag,
  Loader2,
} from 'lucide-react'
import { getPlanForGuests, formatBRLFromCents } from '@/lib/billing/pricing'
import { Switch } from "@/components/ui/switch"

export default function CriarEventoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [events, setEvents] = useState([]) // opcional: se quiser ver a lista local
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startsAt: '',
    guests: 0,
    allowCompanion: false,
    templateKind: 'default', // default | aniversario | casamento | outros
    initialGifts: [],
    initialRoles: [], // {role: 'padrinho'|'madrinha', name:''}
  })
 const router = useRouter()
  // Helpers de UI (lista de presentes)
  const addGift = () =>
    setEventForm(f => ({ ...f, initialGifts: [...(f.initialGifts || []), { title: '', link: '', priceCents: '' }] }))
  const removeGift = (i) =>
    setEventForm(f => ({ ...f, initialGifts: (f.initialGifts || []).filter((_, idx) => idx !== i) }))
  const editGift = (i, key, value) =>
    setEventForm(f => ({
      ...f,
      initialGifts: (f.initialGifts || []).map((g, idx) => (idx === i ? { ...g, [key]: value } : g)),
    }))

  // Helpers de UI (padrinhos/madrinhas)
  const addRole = () =>
    setEventForm(f => ({ ...f, initialRoles: [...(f.initialRoles || []), { role: 'padrinho', name: '' }] }))
  const removeRole = (i) =>
    setEventForm(f => ({ ...f, initialRoles: (f.initialRoles || []).filter((_, idx) => idx !== i) }))
  const editRole = (i, key, value) =>
    setEventForm(f => ({
      ...f,
      initialRoles: (f.initialRoles || []).map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    }))

  // Preview do plano (rótulo e tier) – não depende de preço
  const plan = useMemo(() => {
    const n = Number(eventForm.guests) || 0
    if (n <= 25) return { requiresPayment: false, label: 'Plano gratuito (até 25)', tier: 'free' }
    if (n <= 50) return { requiresPayment: true, label: 'Mais de 25 (até 50)', tier: 'up_to_50' }
    if (n <= 100) return { requiresPayment: true, label: 'Mais de 50 (até 100)', tier: 'up_to_100' }
    if (n <= 150) return { requiresPayment: true, label: 'Até 150', tier: 'up_to_150' }
    if (n <= 200) return { requiresPayment: true, label: 'Até 200', tier: 'up_to_200' }
    return { requiresPayment: true, label: '200+', tier: '200_plus' }
  }, [eventForm.guests])

  // Envio para a sua API /api/events (já com redirecionamento ao Stripe se for pago)
  const createEvent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Monta payload — inclui campos de personalização
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        startsAt: eventForm.startsAt, // deve ser "YYYY-MM-DDTHH:mm" (sem timezone); servidor converte para America/Sao_Paulo
        guests: Number(eventForm.guests) || 0,
        allowCompanion: !!eventForm.allowCompanion,
        templateKind: eventForm.templateKind,
        initialGifts: (eventForm.initialGifts || []).map(g => ({
          title: (g.title || '').trim(),
          link: (g.link || '').trim(),
          priceCents: g.priceCents ? String(g.priceCents).replace(/\D/g,'') : null,
        })),
        initialRoles: (eventForm.initialRoles || []).map(r => ({
          role: r.role === 'madrinha' ? 'madrinha' : 'padrinho',
          name: (r.name || '').trim(),
        })),
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let data = null
      try { data = await res.json() } catch { data = null }

      const needsPayment = res.status === 402 || (data && data.requiresPayment)
      if (needsPayment) {
        const checkoutUrl = data?.checkoutUrl || data?.url || data?.session?.url
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
        throw new Error('Não foi possível obter a URL de pagamento.')
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar evento')
      }

      // sucesso (plano gratuito)
      setEvents([data, ...events])
      setEventForm({
        title: '',
        description: '',
        location: '',
        startsAt: '',
        guests: 0,
        allowCompanion: false,
        templateKind: 'default',
        initialGifts: [],
        initialRoles: [],
      })
      alert('Evento criado!')
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-800 to-sky-500 bg-clip-text text-transparent">
            SmartInvite 
          </div>
          <div>
             <Button
      variant="outline"
      onClick={() => router.push('/Pages')}
      className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500 transition-colors flex items-center"
    >Voltar 
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-blue-900">Criar Evento</h1>
            <p className="text-gray-600">Preencha os detalhes do seu evento e personalize a página de confirmação.</p>
          </header>

          <form onSubmit={createEvent} className="bg-white/90 backdrop-blur rounded-2xl shadow border border-gray-200 p-6 space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                value={eventForm.title}
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                value={eventForm.description}
                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>

            {/* Nº de convidados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Convidados</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  onClick={() => setEventForm({ ...eventForm, guests: Math.max((eventForm.guests || 0) - 1, 0) })}
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  value={eventForm.guests || 0}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, guests: Math.max(parseInt(e.target.value) || 0, 0) })
                  }
                  className="w-24 text-center rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                />

                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  onClick={() => setEventForm({ ...eventForm, guests: (eventForm.guests || 0) + 1 })}
                >
                  +
                </button>
              </div>

              {/* Aviso de plano */}
              <div className={`mt-3 rounded-lg border p-3 text-sm ${
                plan.requiresPayment
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}>
                {plan.requiresPayment ? (
                  <div className="space-y-1">
                    <div className="font-medium">{plan.label}</div>
                    <div className="text-xs opacity-80">O pagamento será solicitado ao criar o evento.</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-medium">Plano gratuito 🎉</div>
                    <div>Até 25 convidados sem custo.</div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1">Informe quantos convidados estarão presentes.</p>
            </div>

            {/* Tipo de página (custom select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de página</label>
              <div className="relative">
                <select
                  className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-300"
                  value={eventForm.templateKind || 'default'}
                  onChange={e => setEventForm({ ...eventForm, templateKind: e.target.value })}
                >
                  <option value="default">Padrão</option>
                  <option value="aniversario">Aniversário</option>
                  <option value="casamento">Casamento</option>
                  <option value="outros">Outros</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▾</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Isso define os blocos extras (lista de presentes, padrinhos etc.) da página pública.
              </p>
            </div>

            {/* Lista de Presentes (aniversário e casamento) */}
            {['aniversario','casamento'].includes(eventForm.templateKind) && (
              <div className="mt-2 space-y-2">
                <div className="font-medium text-gray-800">Lista de presentes</div>

                {(eventForm.initialGifts || []).map((g, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <input
                      className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Título"
                      value={g.title}
                      onChange={e => editGift(i, 'title', e.target.value)}
                    />
                    <input
                      className="sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Link (opcional)"
                      value={g.link || ''}
                      onChange={e => editGift(i, 'link', e.target.value)}
                    />
                    <input
                      className="sm:col-span-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      type="number" min="0" placeholder="Preço (centavos)"
                      value={g.priceCents || ''}
                      onChange={e => editGift(i, 'priceCents', e.target.value.replace(/\D/g, ''))}
                    />
                    <button
                      type="button"
                      className="sm:col-span-6 justify-self-start px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                      onClick={() => removeGift(i)}
                    >
                      Remover
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={addGift}
                >
                  + Adicionar presente
                </button>

                <p className="text-xs text-gray-500">Preço em centavos é opcional (ex.: R$ 199,90 → 19990).</p>
              </div>
            )}

            {/* Padrinhos/Madrinhas (casamento) */}
            {eventForm.templateKind === 'casamento' && (
              <div className="mt-2 space-y-2">
                <div className="font-medium text-gray-800">Padrinhos e Madrinhas</div>

                {(eventForm.initialRoles || []).map((r, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div className="relative">
                      <select
                        className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-300"
                        value={r.role}
                        onChange={e => editRole(i, 'role', e.target.value)}
                      >
                        <option value="padrinho">Padrinho</option>
                        <option value="madrinha">Madrinha</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▾</span>
                    </div>

                    <input
                      className="sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Nome"
                      value={r.name}
                      onChange={e => editRole(i, 'name', e.target.value)}
                    />

                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                      onClick={() => removeRole(i)}
                    >
                      Remover
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={addRole}
                >
                  + Adicionar
                </button>
              </div>
            )}

            {/* Permitir acompanhante */}
            <div>
              <label htmlFor="allowCompanion" className="block text-sm font-medium text-gray-700 mb-1">
                Permitir acompanhante?
              </label>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-gray-600">
                  {eventForm.allowCompanion
                    ? 'Os convidados poderão levar um acompanhante'
                    : 'Os convidados não poderão levar acompanhante'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={eventForm.allowCompanion}
                  onClick={() => setEventForm({ ...eventForm, allowCompanion: !eventForm.allowCompanion })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    eventForm.allowCompanion ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      eventForm.allowCompanion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                value={eventForm.location}
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>

            {/* Data/Hora (datetime-local) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                value={eventForm.startsAt}
                onChange={e => setEventForm({ ...eventForm, startsAt: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Dica: use o horário local. O servidor converte para America/Sao_Paulo ao salvar.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-700 to-sky-500 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando…' : plan.requiresPayment ? 'Continuar para pagamento' : 'Criar'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
