'use client'

import { Suspense, useState, useEffect } from 'react'
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
import Link from 'next/link'
import AppAlert from '@/components/ui/app-alert'
import { Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // estados
const [confirmModalOpen, setConfirmModalOpen] = useState(false);
const [confirmGuests, setConfirmGuests] = useState([]);
const [loadingConfirm, setLoadingConfirm] = useState(false);
  // App state
  const [events, setEvents] = useState([])
  const [templates, setTemplates] = useState([])
  const [dashboardStats, setDashboardStats] = useState({})
  const [currentEvent, setCurrentEvent] = useState(null)
const [alert, setAlert] = useState(null);
  // Forms state
  // estado do formulário
const [eventForm, setEventForm] = useState({
  title: '', description: '', location: '',
  startsAt: '', guests: 0, allowCompanion: false,
  templateKind: 'default',
  initialGifts: [],            // [{title:'', link:'', priceCents:''}]
  initialRoles: []             // [{role:'padrinho'|'madrinha', name:''}]
})

  const [guestForm, setGuestForm] = useState({ name: '', phoneE164: '', email: '', tag: '' })
  const [templateForm, setTemplateForm] = useState({ name: '', bodyText: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace('/auth')
        return
      }
      setUser(session.user)
      await loadUserData()
    } catch (e) {
      console.error(e)
      router.replace('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const [eventsRes, templatesRes, dashboardRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/templates'),
        fetch('/api/dashboard')
      ])
      if (eventsRes.ok) setEvents(await eventsRes.json())
      if (templatesRes.ok) setTemplates(await templatesRes.json())
      if (dashboardRes.ok) setDashboardStats(await dashboardRes.json())
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
      router.replace('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const copyRsvpLink = async (event) => {
    try {
      if (!event?.rsvp_token) {
        alert('Este evento ainda não possui link de RSVP.')
        return
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const path = event.public_rsvp_path || `/r/${event.rsvp_token}`;
      const url = `${origin}${path}`;

      await navigator.clipboard.writeText(url)
        setAlert({
    type: "success",
    title: "Link copiado!",
    message: "O link do evento foi copiado com sucesso!",
  });
    } catch (e) {
      console.error(e)
      alert('Não foi possível copiar o link.')
    }
  }

  // Converte "YYYY-MM-DDTHH:mm" para ISO com timezone São Paulo (UTC-3)
function toSaoPauloISO(dtLocal) {
  if (!dtLocal) return null;            // aceita vazio
  if (/([Z]|[+-]\d\d:\d\d)$/.test(dtLocal)) return dtLocal; // já tem offset
  return `${dtLocal}:00-03:00`;         // Brasil sem horário de verão desde 2019
}

  const createEvent = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...eventForm,
        startsAt: toSaoPauloISO(eventForm.startsAt),
        endsAt: eventForm.endsAt ? toSaoPauloISO(eventForm.endsAt) : null,
        allowCompanion: !!eventForm.allowCompanion,
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let data = null
      try { data = await res.json() } catch {}

      const needsPayment = res.status === 402 || (data && data.requiresPayment)
      if (needsPayment) {
        const checkoutUrl = data?.checkoutUrl || data?.url || data?.session?.url
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        } else {
          throw new Error('Não foi possível obter a URL de pagamento.')
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar evento')
      }

      setEvents([data, ...events])
      setEventForm({ title: '', description: '', location: '', startsAt: '', endsAt: '', guests: 0, allowCompanion: false })
      alert('Evento criado!')
      // Se for até 25 convidados e não precisar pagar
  if ((data.guests || 0) <= 25) {
    window.location.reload()
  } else {
    alert('Evento criado!')
  }
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }



  const addGuest = async (eventId) => {
    if (!guestForm.name || !guestForm.phoneE164) {
      alert('Nome e telefone são obrigatórios.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...guestForm, eventId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar convidado')
      await loadEventDetails(eventId)
      setGuestForm({ name: '', phoneE164: '', email: '', tag: '' })
      alert('Convidado adicionado!')
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const createTemplate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar template')
      setTemplates([data, ...templates])
      setTemplateForm({ name: '', bodyText: '' })
      alert('Template criado!')
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadEventDetails = async (eventId) => {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      if (res.ok) setCurrentEvent(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 grid place-items-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-700">Carregando...</span>
        </div>
      </div>
    )
  }

  const guestsCount = Number(eventForm.guests || 0)
  const plan = getPlanForGuests(guestsCount)

  function getStripePriceByGuests(n) {
  if (n <= 25)  return { priceId: null, label: 'Grátis até 25', tier: 'free' };
  if (n <= 50)  return { priceId: 'price_1RvU2uLRumVLvijpv4XZsJql', label: 'Mais de 25 (até 50)', tier: 'up_to_50' };
  if (n <= 100) return { priceId: 'price_1RvU4BLRumVLvijpdWM8GdRP', label: 'Mais de 50 (até 100)', tier: 'up_to_100' };
  if (n <= 150) return { priceId: 'price_1RvU5ZLRumVLvijpWrcx4A74', label: 'Até 150', tier: 'up_to_150' };
  if (n <= 200) return { priceId: 'price_1RvUQhLRumVLvijpTYgvmNiq', label: 'Até 200', tier: 'up_to_200' };
  return { priceId: 'price_1RvURYLRumVLvijpG60lMbO3', label: '200+', tier: '200_plus' };
}

async function continuePayment(ev) {
  try {
    const res = await fetch('/api/billing/checkout/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: ev.id,
        successRedirect: '/inicial',
        cancelRedirect: '/inicial'
      })
    })
    const data = await res.json()
    if (data.alreadyPaid) {
      alert('Pagamento já concluído para este evento.')
      return
    }
    if (!res.ok || !data.checkoutUrl) {
      alert(data.error || 'Não foi possível abrir o checkout.')
      return
    }
    window.location.href = data.checkoutUrl
  } catch (e) {
    console.error(e)
    alert('Erro ao redirecionar para pagamento.')
  }
}



// buscar confirmados de um evento
async function openConfirmed(ev) {
  setLoadingConfirm(true);
  setConfirmGuests([]);
  try {
    const res = await fetch(`/api/events/${ev.id}/guests?status=confirmed`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Falha ao carregar confirmados');
    setConfirmGuests(data.guests || []);
    setConfirmModalOpen(true);
  } catch (e) {
    alert(e.message || 'Erro ao carregar convidados confirmados');
  } finally {
    setLoadingConfirm(false);
  }
}

// exportar CSV (cliente)
function exportGuestsCSV() {
  const header = ['Nome'];
  const rows = confirmGuests.map(g => ([
    g?.name || ''
  ]));

  const escapeCSV = (v) => {
    const s = String(v ?? '');
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [header, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `convidados-confirmados.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const addGift = () =>
  setEventForm(f => ({...f, initialGifts: [...(f.initialGifts||[]), { title:'', link:'', priceCents:'' }]}))

const editGift = (i, field, value) =>
  setEventForm(f => ({
    ...f,
    initialGifts: f.initialGifts.map((g,idx)=> idx===i ? {...g, [field]: value} : g)
  }))

const removeGift = (i) =>
  setEventForm(f => ({...f, initialGifts: f.initialGifts.filter((_,idx)=> idx!==i)}))

const addRole = () =>
  setEventForm(f => ({...f, initialRoles: [...(f.initialRoles||[]), { role:'padrinho', name:'' }]}))

const editRole = (i, field, value) =>
  setEventForm(f => ({
    ...f,
    initialRoles: f.initialRoles.map((r,idx)=> idx===i ? {...r, [field]: value} : r)
  }))

const removeRole = (i) =>
  setEventForm(f => ({...f, initialRoles: f.initialRoles.filter((_,idx)=> idx!==i)}))


  return (
     <Suspense fallback={null}>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100">
      {/* Topbar */}

<header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
  <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <div className="text-xl font-bold bg-gradient-to-r from-blue-800 to-sky-500 bg-clip-text text-transparent">
      SmartInvite
    </div>

 <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/Pages/newEvent" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Evento
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  </div>
</header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur border border-gray-200">
            <TabsTrigger value="dashboard">Resumo</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            {/* <TabsTrigger value="guests">Convidados</TabsTrigger> */}
            {/* <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger> */}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <StatCard title="Eventos" value={dashboardStats.totalEvents || 0} icon={<Calendar className="h-4 w-4 text-blue-600" />} />
              <StatCard title="Ativos" value={dashboardStats.activeEvents || 0} icon={<BarChart3 className="h-4 w-4 text-blue-600" />} />
              {/* <StatCard title="Mensagens" value={dashboardStats.messagesSent || 0} icon={<MessageSquare className="h-4 w-4 text-blue-600" />} /> */}
              {/* <StatCard title="Confirmados" value={dashboardStats.totalGuests || 0} icon={<Users className="h-4 w-4 text-blue-600" />} /> */}
            </div>

<Card className="bg-white/80 backdrop-blur border border-gray-200">
  <CardHeader>
    <CardTitle className="text-blue-900">Eventos recentes</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {events.slice(0, 5).map((ev) => (
      <div
        key={ev.id}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg"
      >
        <div>
          <div className="font-semibold text-blue-900">{ev.title}</div>
<div className="text-xs text-gray-600">
  {new Date(ev.starts_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
</div>

        </div>
        <div className="flex items-center gap-3">
          {/* Bolinha de status */}
          <span
            className={`w-3 h-3 rounded-full `}
          ></span>

   <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900 sm:w-auto"
            onClick={() => openConfirmed(ev)}
          >
            Confirmados
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900 sm:w-auto"
            onClick={() => copyRsvpLink(ev)}
          >
            Copiar link
          </Button>
        </div>

        </div>
      </div>
    ))}
  </CardContent>
</Card>

          </TabsContent>
<Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
  <DialogContent className="bg-white/95 backdrop-blur border border-gray-200 max-w-2xl">
    <DialogHeader>
      <DialogTitle className="text-blue-900">Convidados confirmados</DialogTitle>
      <DialogDescription>
        {loadingConfirm
          ? 'Carregando…'
          : `${confirmGuests.length} confirmado(s)`}
      </DialogDescription>
    </DialogHeader>

    {!loadingConfirm && (
      <div className="max-h-80 overflow-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2">Nome</th>
              {/* <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Telefone</th> */}
            </tr>
          </thead>
          <tbody>
            {confirmGuests.map(g => (
              <tr key={g.id} className="border-t">
                <td className="p-2">{g.name || '-'}</td>
                {/* <td className="p-2">{g.email || '-'}</td>
                <td className="p-2">{g.phone_e164 || g.phone || '-'}</td> */}
              </tr>
            ))}
            {confirmGuests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={3}>
                  Nenhum confirmado até o momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex justify-end gap-2 pt-3">
      <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
        Fechar
      </Button>
       {/* <Button
        onClick={exportGuestsCSV}
        disabled={loadingConfirm || confirmGuests.length === 0}
        className="bg-gradient-to-r from-blue-700 to-sky-500"
      >
        Exportar CSV
      </Button>  */}
    </div>
  </DialogContent>
</Dialog>

          {/* Eventos */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <Card key={ev.id} className="bg-white/80 backdrop-blur border border-gray-200 hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-blue-900">{ev.title}</CardTitle>
                      <Badge variant={ev.status === 'active' ? 'default' : 'secondary'}>{ev.status}</Badge>
                    </div>
                    <CardDescription className="text-gray-600">{ev.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-700">
                      {ev.location && <Row icon={<MapPin className="w-4 h-4 text-blue-600" />} text={ev.location} />}
                      <Row icon={<Clock className="w-4 h-4 text-blue-600" />} text={new Date(ev.starts_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}/>  
                      <Row icon={<Users className="w-4 h-4 text-blue-600" />} text={`${ev.guests?.length || 0} confirmados`} />
                    </div>
                              
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-black"
                          onClick={() => openConfirmed(ev)}
                        >
                          Ver confirmados
                        </Button>

                          <Button
                            className="bg-gradient-to-r from-blue-700 to-sky-500"
                            onClick={() => copyRsvpLink(ev)}
                          >
                            Copiar Link
                          </Button>
                     
                      </div>

                   
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Convidados */}
          <TabsContent value="guests" className="space-y-6">
            {currentEvent ? (
              <Card className="bg-white/80 backdrop-blur border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Convidados — {currentEvent.title}</CardTitle>
                  <CardDescription className="text-gray-600">Adicione convidados e acompanhe.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <Input value={guestForm.name} onChange={e => setGuestForm({ ...guestForm, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Telefone (E.164)</Label>
                        <Input placeholder="+5511999999999" value={guestForm.phoneE164} onChange={e => setGuestForm({ ...guestForm, phoneE164: e.target.value })} />
                      </div>
                      <div>
                        <Label>Email (opcional)</Label>
                        <Input type="email" value={guestForm.email} onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} />
                      </div>
                      <div>
                        <Label>Tag (opcional)</Label>
                        <Input value={guestForm.tag} onChange={e => setGuestForm({ ...guestForm, tag: e.target.value })} />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-700 to-sky-500" disabled={isSubmitting} onClick={() => addGuest(currentEvent.id)}>
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Adicionar convidado
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[26rem] overflow-y-auto">
                      {currentEvent.guests?.map((g) => (
                        <div key={g.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium text-blue-900">{g.name}</div>
                              <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                <Phone className="w-3 h-3 text-blue-600" /> {g.phone_e164}
                              </div>
                              {g.email && (
                                <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                  <Mail className="w-3 h-3 text-blue-600" /> {g.email}
                                </div>
                              )}
                              {g.tag && (
                                <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                  <Tag className="w-3 h-3 text-blue-600" /> {g.tag}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline">Pendente</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur border border-gray-200">
                <CardContent className="py-12 text-center text-gray-600">
                  Selecione um evento na aba <b>Eventos</b> para gerenciar convidados.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur border border-gray-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Novo template</CardTitle>
                <CardDescription className="text-gray-600">
                  Use variáveis como {'{'}{`{name}`}{'}'}, {'{'}{`{event_title}`}{'}'}, {'{'}{`{starts_at}`}{'}'} e {'{'}{`{rsvp_link}`}{'}'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTemplate} className="space-y-4">
                  <div>
                    <Label>Nome do template</Label>
                    <Input value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Mensagem</Label>
                    <Textarea rows={6} placeholder="Oi {{name}}! Você está convidado(a) para {{event_title}}..." value={templateForm.bodyText} onChange={e => setTemplateForm({ ...templateForm, bodyText: e.target.value })} required />
                  </div>
                  <Button type="submit" className="bg-gradient-to-r from-blue-700 to-sky-500" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Salvar template
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((t) => (
                <Card key={t.id} className="bg-white/80 backdrop-blur border border-gray-200">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-blue-900">{t.name}</CardTitle>
                    <Badge variant="outline">{t.channel}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {t.body_text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mensagens */}
          <TabsContent value="messages">
            <Card className="bg-white/80 backdrop-blur border border-gray-200">
              <CardContent className="py-12 text-center text-gray-600">
                Selecione um evento e um template para enviar convites pelo WhatsApp.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          {alert && (
                <AppAlert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              )}
      </main>
    </div>
    </Suspense>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <Card className="bg-white/80 backdrop-blur border border-gray-200">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-900">{value}</div>
      </CardContent>
    </Card>
  )
}
function Row({ icon, text }) {
  return <div className="flex items-center gap-2">{icon}<span>{text}</span></div>
}
