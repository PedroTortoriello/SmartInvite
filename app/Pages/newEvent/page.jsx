// pages/eventos/criar.jsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Calendar, Users, MapPin, Link as LinkIcon, Check } from 'lucide-react';
import { getPlanForGuests, formatBRLFromCents } from '@/lib/billing/pricing';
import AppAlert from '@/components/ui/app-alert';

export default function CriarEventoPage() {
  const router = useRouter();
const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startsAt: '',
    guests: 0,
    allowCompanion: false,
    templateKind: 'default', // default | aniversario | casamento | outros
    initialGifts: [],
    initialRoles: [], // { role: 'padrinho'|'madrinha', name: '' }
  });

  // Dialog de sucesso + link público
  const [successOpen, setSuccessOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // App state
  const [events, setEvents] = useState([])

  // Helpers (presentes)
  const addGift = () =>
    setEventForm(f => ({
      ...f,
      initialGifts: [...(f.initialGifts || []), { title: '', link: '', priceCents: '' }],
    }));
  const removeGift = (i) =>
    setEventForm(f => ({
      ...f,
      initialGifts: (f.initialGifts || []).filter((_, idx) => idx !== i),
    }));
  const editGift = (i, key, value) =>
    setEventForm(f => ({
      ...f,
      initialGifts: (f.initialGifts || []).map((g, idx) => (idx === i ? { ...g, [key]: value } : g)),
    }));

  // Helpers (padrinhos/madrinhas)
  const addRole = () =>
    setEventForm(f => ({
      ...f,
      initialRoles: [...(f.initialRoles || []), { role: 'padrinho', name: '' }],
    }));
  const removeRole = (i) =>
    setEventForm(f => ({
      ...f,
      initialRoles: (f.initialRoles || []).filter((_, idx) => idx !== i),
    }));
  const editRole = (i, key, value) =>
    setEventForm(f => ({
      ...f,
      initialRoles: (f.initialRoles || []).map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    }));

    function toSaoPauloISO(dtLocal) {
  if (!dtLocal) return null;            // aceita vazio
  if (/([Z]|[+-]\d\d:\d\d)$/.test(dtLocal)) return dtLocal; // já tem offset
  return `${dtLocal}:00-03:00`;         // Brasil sem horário de verão desde 2019
}

  // Plano por nº de convidados (rótulo + possível preço estimado)
  const plan = useMemo(() => {
    const n = Number(eventForm.guests) || 0;
    if (n <= 25) return { requiresPayment: false, label: 'Plano gratuito (até 25)', tier: 'free' };
    if (n <= 50) return { requiresPayment: true, label: 'Mais de 25 (até 50)', tier: 'up_to_50' };
    if (n <= 100) return { requiresPayment: true, label: 'Mais de 50 (até 100)', tier: 'up_to_100' };
    if (n <= 150) return { requiresPayment: true, label: 'Até 150', tier: 'up_to_150' };
    if (n <= 200) return { requiresPayment: true, label: 'Até 200', tier: 'up_to_200' };
    return { requiresPayment: true, label: '200+', tier: '200_plus' };
  }, [eventForm.guests]);

  // (Opcional) tenta extrair preço do seu helper – sem quebrar caso a API mude
  const planPriceLabel = useMemo(() => {
    try {
      const info = getPlanForGuests?.(Number(eventForm.guests) || 0);
      const cents = info?.priceCents ?? info?.price_cents;
      if (typeof cents === 'number') return formatBRLFromCents?.(cents);
    } catch {}
    return null;
  }, [eventForm.guests]);

  // Prefixo do link público conforme tipo
  const publicPrefix = (kind) => {
    switch (kind) {
      case 'aniversario':
        return 'b';
      case 'casamento':
        return 'w';
      case 'workshop':
        return 'ws';
      case 'empresarial':
        return 'emp';
      default:
        return 'e';
    }
  };

  // Persiste o "publicPath" após criar, se necessário
  const persistPublicPath = async ({ id, token, templateKind, fallbackOrigin }) => {
    const prefix = publicPrefix(templateKind);
    const path = `${prefix}/${token}`;
    const origin = fallbackOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    const urlFallback = origin ? `${origin}/${path}` : `/${path}`;

    try {
      // Tente atualizar no backend (ajuste o endpoint conforme sua API)
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicPath: path }),
      });
      const data = await safeJson(res);
      // Se o backend devolver a URL final, use-a
      return data?.public_url || data?.publicUrl || data?.url || urlFallback;
    } catch {
      return urlFallback;
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

   const createEvent = async (e) => {
     e.preventDefault();
     setIsSubmitting(true);
     setPublicUrl('');
     setSuccessOpen(false);

     try {
   
       const payload = {
         title: eventForm.title,
         description: eventForm.description,
         location: eventForm.location,
         startsAt: eventForm.startsAt, 
         guests: Number(eventForm.guests) || 0,
         allowCompanion: !!eventForm.allowCompanion,
         templateKind: eventForm.templateKind,
         preferredPublicPrefix: publicPrefix(eventForm.templateKind),
         initialGifts: (eventForm.initialGifts || []).map(g => ({
           title: (g.title || '').trim(),
           link: (g.link || '').trim(),
           priceCents: g.priceCents ? String(g.priceCents).replace(/\D/g, '') : null,
         })),
         initialRoles: (eventForm.initialRoles || []).map(r => ({
           role: r.role === 'madrinha' ? 'madrinha' : 'padrinho',
           name: (r.name || '').trim(),
         })),
       };

       const res = await fetch('/api/events', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
       });

       const data = await safeJson(res);

   
       const needsPayment = res.status === 402 || data?.requiresPayment;
       if (needsPayment) {
         const checkoutUrl = data?.checkoutUrl || data?.url || data?.session?.url;
         if (!checkoutUrl) throw new Error('Não foi possível obter a URL de pagamento.');
         window.location.href = checkoutUrl;
         return;
       }


       if (!res.ok) throw new Error(data?.error || data?.message || 'Erro ao criar evento');
        
       let finalUrl =
         data?.public_url ||
         data?.publicUrl ||
         data?.url ||
         '';

       if (!finalUrl) {
          
         const token = data?.token || data?.public_token || data?.publicToken;
         const id = data?.id;
         if (token && id) {
           finalUrl = await persistPublicPath({
             id,
             token,
             templateKind: eventForm.templateKind,
             fallbackOrigin: typeof window !== 'undefined' ? window.location.origin : '',
           });
         }
       }

      
       if (finalUrl) {
         setPublicUrl(finalUrl);
         setSuccessOpen(true);
       } else {
          if (!needsPayment) {

}

  setAlert({
    type: "success",
    title: "Evento criado 🎉",
    message: "Seu evento foi criado com sucesso!",
  });
       }

 
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
       });
     } catch (err) {
      setAlert({
        type: "error",
        title: "Erro",
        message: err?.message || "Erro ao criar evento",
      });
     } finally {
       setIsSubmitting(false);
     }
   };

//   const createEvent = async (e) => {
//   e.preventDefault()
//   setIsSubmitting(true)

//   try {
//     const payload = {
//       ...eventForm,
//       startsAt: toSaoPauloISO(eventForm.startsAt),
//       endsAt: eventForm.endsAt ? toSaoPauloISO(eventForm.endsAt) : null,
//       allowCompanion: !!eventForm.allowCompanion,
//     }

//     const res = await fetch('/api/events', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     })

//     let data = null
//     try { data = await res.json() } catch {}

//     const needsPayment = res.status === 402 || (data && data.requiresPayment)
//     if (needsPayment) {
//       const checkoutUrl = data?.checkoutUrl || data?.url || data?.session?.url
//       if (checkoutUrl) {
//         window.location.href = checkoutUrl
//         return
//       } else {
//         throw new Error('Não foi possível obter a URL de pagamento.')
//       }
//     }

//     if (!res.ok) {
//       throw new Error(data?.error || 'Erro ao criar evento')
//     }

//     setEvents([data, ...events])
//     setEventForm({ title: '', description: '', location: '', startsAt: '', endsAt: '', guests: 0, allowCompanion: false })
//     alert('Evento criado!')
//     // Se for até 25 convidados e não precisar pagar
// if ((data.guests || 0) <= 25) {
//   window.location.reload()
// } else {
//   alert('Evento criado!')
// }
//   } catch (err) {
//     alert(err.message)
//   } finally {
//     setIsSubmitting(false)
//   }
// }
  const disabled = isSubmitting;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-800 to-sky-500 bg-clip-text text-transparent">
            SmartInvite
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/Pages')}
            className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500 transition-colors"
          >
            Voltar
          </Button>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-blue-900">Criar Evento</h1>
            <p className="text-gray-600">Preencha os detalhes do seu evento e personalize a página pública.</p>
          </header>

          <Card className="bg-white/90 backdrop-blur shadow border border-gray-200">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>Defina os campos básicos e, se quiser, adicione presentes e padrinhos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createEvent} className="space-y-6">
                                {/* Tipo de página */}
           <div className="space-y-2">
                  <Label htmlFor="templateKind">Tipo de Evento</Label>
                  <div className="relative">
   <select
  id="templateKind"
  className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-300"
  value={eventForm.templateKind || 'default'}
  onChange={e => {
    const val = e.target.value;
    setEventForm(f => ({
      ...f,
      templateKind: val,
      // só mantém padrinhos/madrinhas para casamento
      initialRoles: val === 'casamento' ? f.initialRoles : [],
    }));
  }}
  disabled={disabled}
>
  <option value="default">Padrão</option>
  <option value="aniversario">Aniversário</option>
  <option value="casamento">Casamento</option>
  <option value="workshop">Workshop</option>
  <option value="empresarial">Empresarial</option>
</select>

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▾</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Isso ativa blocos extras (lista de presentes, padrinhos etc.) na página pública.
                  </p>
                </div>  
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={eventForm.title}
                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                    disabled={disabled}
                    placeholder="Ex.: Aniversário do Pedro"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={eventForm.description}
                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                    disabled={disabled}
                    placeholder="Mensagem curta para seus convidados (opcional)"
                  />
                </div>

                {/* Convidados + plano */}
                <div className="space-y-2">
                  <Label>Número de Convidados</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEventForm({ ...eventForm, guests: Math.max((eventForm.guests || 0) - 1, 0) })}
                      disabled={disabled}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={eventForm.guests || 0}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, guests: Math.max(parseInt(e.target.value) || 0, 0) })
                      }
                      className="w-28 text-center"
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEventForm({ ...eventForm, guests: (eventForm.guests || 0) + 1 })}
                      disabled={disabled}
                    >
                      +
                    </Button>
                  </div>

                  <div
                    className={`mt-3 rounded-lg border p-3 text-sm ${
                      plan.requiresPayment
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <div className="font-medium">{plan.label}</div>
                    {plan.requiresPayment ? (
                      <div className="text-xs opacity-80 mt-1">
                        O pagamento será solicitado ao criar o evento.
                        {planPriceLabel ? ` Valor estimado: ${planPriceLabel}.` : ''}
                      </div>
                    ) : (
                      <div className="text-xs opacity-80 mt-1">Até 25 convidados sem custo.</div>
                    )}
                  </div>
                </div>



                {/* Lista de Presentes */}
                {['aniversario', 'casamento'].includes(eventForm.templateKind) && (
                  <div className="space-y-2">
                    <Label>Lista de presentes</Label>

                    {(eventForm.initialGifts || []).map((g, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                        <Input
                          className="sm:col-span-2"
                          placeholder="Título"
                          value={g.title}
                          onChange={e => editGift(i, 'title', e.target.value)}
                          disabled={disabled}
                        />
                        <Input
                          className="sm:col-span-3"
                          placeholder="Link (opcional)"
                          value={g.link || ''}
                          onChange={e => editGift(i, 'link', e.target.value)}
                          disabled={disabled}
                        />
                        <Input
                          className="sm:col-span-1"
                          type="number"
                          min="0"
                          placeholder="Preço (centavos)"
                          value={g.priceCents || ''}
                          onChange={e => editGift(i, 'priceCents', e.target.value.replace(/\D/g, ''))}
                          disabled={disabled}
                        />
                        <div className="sm:col-span-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeGift(i)}
                            disabled={disabled}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                    <br />
                    <Button type="button" variant="outline" onClick={addGift} disabled={disabled}>
                      + Adicionar presente
                    </Button>
                    <p className="text-xs text-gray-500">Preço em centavos é opcional (ex.: R$ 199,90 → 19990).</p>
                  </div>
                )}

                {/* Padrinhos/Madrinhas */}
                {eventForm.templateKind === 'casamento' && (
                  <div className="space-y-2">
                    <Label>Padrinhos e Madrinhas</Label>

                    {(eventForm.initialRoles || []).map((r, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <div className="relative">
                          <select
                            className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-300"
                            value={r.role}
                            onChange={e => editRole(i, 'role', e.target.value)}
                            disabled={disabled}
                          >
                            <option value="padrinho">Padrinho</option>
                            <option value="madrinha">Madrinha</option>
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▾</span>
                        </div>

                        <Input
                          className="sm:col-span-3"
                          placeholder="Nome"
                          value={r.name}
                          onChange={e => editRole(i, 'name', e.target.value)}
                          disabled={disabled}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeRole(i)}
                          disabled={disabled}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                    <br />
                    <Button type="button" variant="outline" onClick={addRole} disabled={disabled}>
                      + Adicionar
                    </Button>
                  </div>
                )}

                {/* Acompanhante */}
                <div className="space-y-2">
                  <Label>Permitir acompanhante?</Label>
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
                      disabled={disabled}
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
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                    disabled={disabled}
                    placeholder="Endereço ou nome do local"
                  />
                </div>

                {/* Data/Hora */}
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Data e hora</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={e => setEventForm({ ...eventForm, startsAt: e.target.value })}
                    required
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-500">
                    Use o horário local. O servidor converte para America/Sao_Paulo ao salvar.
                  </p>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={disabled} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando…
                    </>
                  ) : plan.requiresPayment ? (
                    'Continuar para pagamento'
                  ) : (
                    'Criar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          {alert && (
        <AppAlert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
        </div>
      </main>

      {/* Dialog de sucesso com link público */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evento criado com sucesso</DialogTitle>
            <DialogDescription>
              Seu link público já está pronto. Compartilhe com os convidados.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <a
              href={publicUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm text-primary underline"
            >
              {publicUrl || '—'}
            </a>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/Pages')}>
              Fechar
            </Button>
            <Button onClick={copyLink}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado
                </>
              ) : (
                'Copiar link'
              )}
            </Button>
            {publicUrl && (
              <Button asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">Abrir</a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Util – tentar ler JSON mesmo em respostas de erro
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
