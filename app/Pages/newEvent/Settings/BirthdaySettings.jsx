import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Gift, Cake } from "lucide-react";

/**
 * @param {{ hasGiftList: boolean, onGiftListChange: (enabled: boolean) => void }} props
 */
export default function PreviewBirthdayLayout() {
  const [name, setName] = useState('João Pedro');
  const [companions, setCompanions] = useState(['Ana', 'Carlos']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const addCompanion = () => setCompanions(prev => [...prev, '']);
  const removeCompanion = (i) =>
    setCompanions(prev => prev.filter((_, idx) => idx !== i));
  const editCompanion = (i, value) =>
    setCompanions(prev => prev.map((c, idx) => (idx === i ? value : c)));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // simular sucesso
      await new Promise(r => setTimeout(r, 800));
      setDone(true);
    } catch (err) {
      setError('Falha ao confirmar presença');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = name.trim().length > 0;

  const formatPrice = (priceCents) =>
    typeof priceCents === 'number'
      ? (priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

  const event = {
    title: 'Aniversário da Maria Clara',
    description: 'Venha comemorar meus 25 anos com muita alegria e música! 🎶',
    location: 'Salão de Festas Jardins',
    allow_companion: true,
    gifts: [
      { id: 1, title: 'Kit de Maquiagem', link: 'https://example.com/maquiagem', price_cents: 19990 },
      { id: 2, title: 'Livro de Romance', link: 'https://example.com/livro', price_cents: 4990 },
    ],
  };

  return (
    <BirthdayLayout
      event={event}
      dateLabel="25/09/2025 às 19h"
      name={name}
      setName={setName}
      companions={companions}
      addCompanion={addCompanion}
      removeCompanion={removeCompanion}
      editCompanion={editCompanion}
      onSubmit={onSubmit}
      canSubmit={canSubmit}
      submitting={submitting}
      error={error}
      done={done}
      openInMapsUrl="https://www.google.com/maps"
      formatPrice={formatPrice}
    />
  );
}