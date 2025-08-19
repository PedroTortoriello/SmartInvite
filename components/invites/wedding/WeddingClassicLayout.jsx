'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ExternalLink } from "lucide-react";

/* --------- Utilitários --------- */
function Flourish({ className = "" }) {
  return (
    <svg viewBox="0 0 160 20" aria-hidden="true" className={className}>
      <path
        d="M2 10c20-10 40 10 60 0s40-10 60 0 20 10 36 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function Monogram({ names }) {
  const initials = useMemo(() => {
    if (!names) return "M • E";
    const parts = names.split("&").map(s => s.trim());
    const getInit = (s) => (s?.[0] || "").toUpperCase();
    if (parts.length === 2) return `${getInit(parts[0])} • ${getInit(parts[1])}`;
    return names.split(" ").slice(0, 2).map(getInit).join(" • ");
  }, [names]);

  return (
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsla(12,28%,40%,0.10)] ring-1 ring-[hsla(12,28%,35%,0.25)]">
      <span className="font-serif text-xl tracking-wider text-[hsl(12,28%,25%)]">{initials}</span>
    </div>
  );
}

function Countdown({ date }) {
  const target = useMemo(() => new Date(date), [date]);
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const Box = ({ label, value }) => (
    <div className="min-w-[5.5rem] rounded-md px-4 py-3 text-center bg-[hsl(12,28%,40%)] text-white">
      <div className="text-2xl font-semibold tracking-wide">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">{label}</div>
    </div>
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Box label="Dias" value={t.d} />
      <Box label="Horas" value={t.h} />
      <Box label="Minutos" value={t.m} />
      <Box label="Segundos" value={t.s} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.28em] text-[hsl(12,10%,35%)]">{eyebrow}</div>
      )}
      <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[hsl(12,28%,20%)]">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm md:text-base text-[hsl(12,8%,35%)]">{subtitle}</p>
      )}
      <div className="mt-5 text-[hsl(12,28%,40%)]">
        <Flourish className="mx-auto h-5 w-40" />
      </div>
    </div>
  );
}

/* --------- Layout --------- */
export default function WeddingClassicLayout({
  event,
  dateLabel,
  onOpenMaps,
  formatPrice,
  /** opcional: chamada quando o convidado confirmar */
  onConfirmRSVP, // (name: string) => Promise<void> | void
  /** token público do RSVP (opcional; se não vier, tenta pegar de event.public_token) */
  rsvpToken,
}) {
  // --- estados do RSVP ---
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [rsvpError, setRsvpError] = useState(null);
  const canSubmit = rsvpName.trim().length > 0 && rsvpStatus !== 'loading';

  const resolveToken = () => {
    if (rsvpToken) return rsvpToken;
    // se o pai passar params
    // (deixe como opcional; não dependa do App Router aqui)
    // @ts-ignore (caso esteja em .tsx)
    if (typeof params !== 'undefined' && params?.token) return params.token;
    if (event?.public_token) return event.public_token;
    if (typeof window !== 'undefined') {
      const qs = new URLSearchParams(window.location.search).get('token');
      if (qs) return qs;
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
    return null;
  };
  const token = resolveToken();

  async function handleConfirmRSVP(e) {
    e.preventDefault();
    if (!canSubmit) return;

    if (!token) {
      setRsvpStatus('error');
      setRsvpError('Token de RSVP ausente.');
      return;
    }

    try {
      setRsvpStatus('loading');
      setRsvpError(null);

      const res = await fetch('/api/public/rsvp/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: rsvpName.trim(),
          companions: [], // ajuste aqui se quiser suportar acompanhantes
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Não foi possível confirmar');

      setRsvpStatus('success');
      if (onConfirmRSVP) {
        // não bloquear a UI caso rejeite
        Promise.resolve(onConfirmRSVP(rsvpName.trim())).catch(() => {});
      }
    } catch (e) {
      setRsvpStatus('error');
      setRsvpError(e?.message || 'Erro ao confirmar presença');
    }
  }

  // fallbacks
  const openMaps = () => {
    if (onOpenMaps) return onOpenMaps();
    if (event?.maps_url) window.open(event.maps_url, '_blank', 'noopener,noreferrer');
  };

  const fmtPrice = (cents) => {
    if (formatPrice) return formatPrice(cents);
    if (typeof cents !== 'number') return '';
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(24,40%,97%),hsl(24,40%,96%))]">
      {/* HERO */}
      <header className="relative overflow-hidden border-b bg-[radial-gradient(1200px_400px_at_50%_-10%,hsla(12,28%,35%,0.12),transparent),linear-gradient(180deg,hsl(24,40%,95%),hsl(24,40%,93%))]">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16 text-center">
          <Monogram names={event?.title || ""} />
          <h1 className="mt-6 font-serif text-4xl md:text-6xl leading-tight text-[hsl(12,28%,20%)]">
            {event.title}
          </h1>

          {event.description && (
            <p className="mx-auto mt-4 max-w-2xl text-[15px] md:text-[17px] leading-relaxed text-[hsl(12,9%,32%)] italic">
              “{event.description}”
            </p>
          )}

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-4 text-[hsl(12,10%,30%)]">
            <div className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm md:text-base">{dateLabel}</span>
            </div>
            {event.location && (
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm md:text-base">{event.location}</span>
              </div>
            )}
          </div>

          {event.starts_at && <Countdown date={event.starts_at} />}

          {event.maps_url && (
            <div className="mt-8">
              <Button variant="outline" onClick={openMaps}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver mapa
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* MENSAGEM */}
      <section className="mx-auto max-w-4xl px-4 py-10 md:py-12">
        <SectionTitle
          eyebrow="Bem-vindos"
          title="Nosso grande dia"
          subtitle="É uma alegria compartilhar com vocês este momento tão especial."
        />
        <div className="mt-6 rounded-xl border bg-white/70 p-6 md:p-8 leading-relaxed text-[hsl(12,10%,28%)]">
          <p className="font-medium">
            Queridos familiares e amigos, cada passo desta jornada foi mais bonito com vocês por perto.
          </p>
          <p className="mt-4">
            Aqui, deixamos detalhes do grande dia, nossa lista de presentes e a confirmação de presença.
            Sua presença é o melhor presente — mas, se desejarem, sintam-se à vontade para escolher algo com carinho.
          </p>
        </div>
      </section>

      {/* CONFIRMAÇÃO DE PRESENÇA */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <SectionTitle
          eyebrow="Confirmação"
          title="Confirmação de Presença"
          subtitle="Informe seu nome para confirmar sua presença."
        />
        <Card className="mt-6 shadow-sm">
          <CardContent className="p-6 md:p-8">
            {rsvpStatus === 'success' ? (
              <div className="text-center">
                <div className="text-lg font-medium text-[hsl(140,50%,28%)]">Presença confirmada! 🎉</div>
                <p className="mt-2 text-[hsl(12,9%,35%)]">
                  Obrigado, {rsvpName}. Estamos felizes em contar com você no nosso grande dia.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmRSVP} className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="flex flex-col">
                  <label className="text-sm text-[hsl(12,10%,30%)] mb-1">Seu nome completo</label>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Ex.: Maria Silva"
                    className="h-10 rounded-md border px-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[hsl(12,28%,40%)]"
                  />
                  {rsvpStatus === 'error' && rsvpError && (
                    <span className="mt-2 text-sm text-[hsl(0,70%,40%)]">{rsvpError}</span>
                  )}
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="bg-[hsl(12,28%,20%)] text-white shadow-sm hover:bg-[hsl(12,28%,25%)]"
                    disabled={!canSubmit}
                  >
                    {rsvpStatus === 'loading' ? 'Confirmando...' : 'Confirmar presença'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* LOCAL */}
      {event.location && (
        <section className="mx-auto max-w-4xl px-4 py-6">
          <SectionTitle eyebrow="Cerimônia & Recepção" title="Local" />
          <Card className="mt-6 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-serif text-2xl text-[hsl(12,28%,20%)]">{event.location}</div>
                  {event.address && (
                    <div className="mt-1 text-sm text-[hsl(12,8%,35%)]">{event.address}</div>
                  )}
                </div>
                {event.maps_url && (
                  <Button variant="outline" onClick={openMaps}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* LISTA DE PRESENTES */}
      {event.gifts?.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10 md:py-12">
          <SectionTitle eyebrow="Com carinho" title="Lista de Presentes" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {event.gifts.map((g) => (
              <div key={g.id} className="rounded-lg border p-4 bg-white/70 hover:bg-white transition">
                <div className="font-medium text-[hsl(12,28%,20%)]">{g.title}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-[hsl(12,9%,35%)]">
                    {fmtPrice(g.price_cents)}
                  </span>
                  {g.link && (
                    <Button asChild variant="outline" size="sm">
                      <a href={g.link} target="_blank" rel="noreferrer">Ver presente</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PADRINHOS & MADRINHAS */}
      {event.wedding_roles?.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-16 md:pb-20">
          <SectionTitle eyebrow="Com amor" title="Padrinhos & Madrinhas" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white/70 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[hsl(210,6%,30%)] mb-2">
                Padrinhos
              </div>
              <ul className="space-y-2">
                {event.wedding_roles
                  .filter((r) => r.role === 'padrinho')
                  .map((r) => (
                    <li key={r.id} className="text-[hsl(12,28%,20%)]">{r.name}</li>
                  ))}
              </ul>
            </div>
            <div className="rounded-lg border bg-white/70 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[hsl(210,6%,30%)] mb-2">
                Madrinhas
              </div>
              <ul className="space-y-2">
                {event.wedding_roles
                  .filter((r) => r.role === 'madrinha')
                  .map((r) => (
                    <li key={r.id} className="text-[hsl(12,28%,20%)]">{r.name}</li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t bg-[hsl(24,40%,96%)]">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-[11px] tracking-[0.2em] text-[hsl(12,10%,35%)] uppercase">
          Com carinho, {event.footer_names || event.title}
        </div>
      </footer>
    </div>
  );
}
