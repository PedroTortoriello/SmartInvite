'use client';

import { useMemo, useState } from 'react';
import BirthdayNeutralLayout from '@/components/invites/birthday/BirthdayLayout';
// ^ Ajuste o caminho acima caso seu layout esteja em outro lugar.

export default function BirthdayClient({ event }) {
  // ---- helpers ----
  const formatDateLabel = (iso) => {
    try {
      const dt = new Date(iso);
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(dt).replace(',', ' —');
    } catch {
      return '';
    }
  };

  const formatPrice = (cents) =>
    typeof cents === 'number'
      ? (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

  const dateLabel = useMemo(() => formatDateLabel(event?.starts_at), [event?.starts_at]);

  const onOpenMaps = () => {
    if (event?.maps_url) window.open(event.maps_url, '_blank', 'noopener,noreferrer');
  };

  // ---- RSVP state ----
  const [name, setName] = useState('');
  const [companions, setCompanions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const addCompanion = () => setCompanions((p) => [...p, '']);
  const editCompanion = (i, v) => setCompanions((p) => p.map((x, idx) => (idx === i ? v : x)));
  const removeCompanion = (i) => setCompanions((p) => p.filter((_, idx) => idx !== i));

  const canSubmit = name.trim().length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          companions: companions.map((c) => c.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.message || 'Falha ao confirmar presença');
      }

      setDone(true);
    } catch (err) {
      setError(err?.message || 'Falha ao confirmar presença');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BirthdayNeutralLayout
      event={event}
      dateLabel={dateLabel}
      onOpenMaps={onOpenMaps}
      formatPrice={formatPrice}
      // RSVP props
      name={name}
      setName={setName}
      companions={companions}
      addCompanion={addCompanion}
      editCompanion={editCompanion}
      removeCompanion={removeCompanion}
      onSubmit={onSubmit}
      canSubmit={canSubmit}
      submitting={submitting}
      done={done}
      error={error}
    />
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
