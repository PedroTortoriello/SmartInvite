'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, ExternalLink, Cake } from "lucide-react";

/* ===== Helpers (apenas UI) ===== */
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
    <div className="min-w-[4.8rem] rounded-md border bg-card px-3 py-2 text-center shadow-sm">
      <div className="text-xl font-semibold text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      <Box label="Dias" value={t.d} />
      <Box label="Horas" value={t.h} />
      <Box label="Min" value={t.m} />
      <Box label="Seg" value={t.s} />
    </div>
  );
}

function SectionTitle({ overline, title, subtitle }) {
  return (
    <div className="text-center">
      {overline && (
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {overline}
        </div>
      )}
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm md:text-base text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

/* ===== Layout Neutro / Unissex ===== */
export default function BirthdayNeutralLayout({
  event,
  dateLabel,
  onOpenMaps,
  formatPrice,
  // RSVP
  name,
  setName,
  companions,
  addCompanion,
  editCompanion,
  removeCompanion,
  onSubmit,
  canSubmit,
  submitting,
  done,
  error,
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero neutro */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            Convite de Aniversário
          </div>

          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {event.title}
          </h1>

          {event.subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              {event.subtitle}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-foreground/80">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dateLabel}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
          </div>

          {event.starts_at && <Countdown date={event.starts_at} />}

          {event.maps_url && (
            <div className="mt-6">
              <Button variant="outline" onClick={onOpenMaps}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver no mapa
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 md:py-12">
        {/* Mensagem */}
        <section>
          <SectionTitle
            overline="Celebração"
            title="Vai ser especial"
            subtitle="Clima leve, boa companhia e momentos para recordar."
          />
          <div className="mt-6 rounded-lg border bg-card p-6 md:p-7 leading-relaxed text-foreground/90">
            <p className="font-medium">{event.message_intro}</p>
            {event.message_extra && <p className="mt-3">{event.message_extra}</p>}
          </div>
        </section>

        {/* Local */}
        {event.location && (
          <section className="mt-10">
            <SectionTitle overline="Onde" title="Local" />
            <Card className="mt-6 shadow-sm">
              <CardContent className="p-6 md:p-7">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-foreground">{event.location}</div>
                    {event.address && (
                      <div className="mt-1 text-sm text-muted-foreground">{event.address}</div>
                    )}
                  </div>
                  {event.maps_url && (
                    <Button variant="outline" onClick={onOpenMaps}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir no Google Maps
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Presentes (opcional) */}
        {event.gifts?.length > 0 && (
          <section className="mt-10">
            <SectionTitle overline="Opcional" title="Lista de presentes" />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.gifts.map((g) => (
                <div key={g.id} className="rounded-lg border bg-card p-4">
                  <div className="font-medium text-foreground">{g.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatPrice?.(g.price_cents) || ""}
                    </span>
                    {g.link && (
                      <Button asChild size="sm" variant="outline">
                        <a href={g.link} target="_blank" rel="noreferrer">Ver presente</a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RSVP */}
        <section className="mt-10">
          <SectionTitle overline="Confirmação" title="Confirme sua presença" />
          <Card className="mt-6 shadow-sm">
            <CardContent className="p-6 md:p-7">
              {done ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Cake className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Presença confirmada</h3>
                  <p className="text-sm text-muted-foreground">
                    Obrigado por confirmar. Te esperamos para celebrar!
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Seu nome completo *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome e sobrenome"
                      required
                    />
                  </div>

                  {event.allow_companion && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Acompanhantes (opcional)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addCompanion}>
                          Adicionar
                        </Button>
                      </div>
                      {companions?.length > 0 && (
                        <div className="space-y-2">
                          {companions.map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Input
                                value={c}
                                onChange={(e) => editCompanion(i, e.target.value)}
                                placeholder={`Nome do acompanhante ${i + 1}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeCompanion(i)}
                                className="h-9 w-9"
                                aria-label={`Remover acompanhante ${i + 1}`}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full"
                  >
                    {submitting ? 'Confirmando...' : 'Confirmar presença'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-5 py-8 text-center text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Com carinho, {event.footer || event.honoree || event.title}
        </div>
      </footer>
    </div>
  );
}
