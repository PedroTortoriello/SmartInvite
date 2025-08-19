'use client';

import WeddingClassicLayout from "@/components/invites/wedding/WeddingClassicLayout";

function formatDateLabel(iso) {
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
}

export default function WeddingClient({ event }) {
  const onOpenMaps = () => {
    if (event?.maps_url) window.open(event.maps_url, '_blank', 'noopener,noreferrer');
  };

  const formatPrice = (cents) =>
    typeof cents === 'number'
      ? (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

  return (
    <WeddingClassicLayout
      event={event}
      dateLabel={formatDateLabel(event?.starts_at)}
      onOpenMaps={onOpenMaps}
      formatPrice={formatPrice}
    />
  );
}
