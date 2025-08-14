'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Users, Loader2, AlertCircle } from "lucide-react";
import { EventTypeSelector } from './Settings/EventTypeSelect';
import { GiftListManager } from "./Settings/GiftListManager";
import { WeddingPartyManager } from "./Settings/WeddingPartyManager";
import { BirthdaySettings } from "./Settings/BirthdaySettings";

export default function CriarEventoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startsAt: '',
    guests: 0,
    allowCompanion: false,
    templateKind: 'default',
    initialGifts: [],
    initialRoles: [],
    hasBirthdayGiftList: false,
  });

  const plan = useMemo(() => {
    const n = Number(eventForm.guests) || 0;
    if (n <= 25) return { requiresPayment: false, label: 'Plano gratuito (até 25)', tier: 'free' };
    if (n <= 50) return { requiresPayment: true, label: 'Mais de 25 (até 50)', tier: 'up_to_50' };
    if (n <= 100) return { requiresPayment: true, label: 'Mais de 50 (até 100)', tier: 'up_to_100' };
    if (n <= 150) return { requiresPayment: true, label: 'Até 150', tier: 'up_to_150' };
    if (n <= 200) return { requiresPayment: true, label: 'Até 200', tier: 'up_to_200' };
    return { requiresPayment: true, label: '200+', tier: '200_plus' };
  }, [eventForm.guests]);

  const updateEventForm = (updates) => {
    setEventForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        startsAt: eventForm.startsAt,
        guests: Number(eventForm.guests) || 0,
        allowCompanion: !!eventForm.allowCompanion,
        templateKind: eventForm.templateKind,
        initialGifts: eventForm.templateKind === 'casamento' 
          ? eventForm.initialGifts.map(g => ({
              title: (g.title || '').trim(),
              link: (g.link || '').trim(),
              priceCents: g.priceCents ? String(g.priceCents).replace(/\D/g,'') : null,
            }))
          : eventForm.templateKind === 'aniversario' && eventForm.hasBirthdayGiftList
          ? eventForm.initialGifts.map(g => ({
              title: (g.title || '').trim(),
              link: (g.link || '').trim(),
              priceCents: g.priceCents ? String(g.priceCents).replace(/\D/g,'') : null,
            }))
          : [],
        initialRoles: eventForm.templateKind === 'casamento'
          ? eventForm.initialRoles.map(r => ({
              role: r.role === 'madrinha' ? 'madrinha' : 'padrinho',
              name: (r.name || '').trim(),
            }))
          : [],
      };

      console.log('Event payload:', payload);

      if (plan.requiresPayment) {
        alert('Redirecionando para pagamento...');
      } else {
        alert('Evento criado com sucesso!');
        router.push('/');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowGiftList = () => {
    return eventForm.templateKind === 'casamento' || 
           (eventForm.templateKind === 'aniversario' && eventForm.hasBirthdayGiftList);
  };

  const shouldShowWeddingParty = () => {
    return eventForm.templateKind === 'casamento';
  };

  const shouldShowBirthdaySettings = () => {
    return eventForm.templateKind === 'aniversario';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-soft">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-800 to-sky-500 bg-clip-text text-transparent">
            SmartInvite 
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/Pages')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar Evento</h1>
          <p className="text-muted-foreground">
            Preencha os detalhes do seu evento e personalize a experiência dos convidados.
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
            <CardDescription>
              Configure os detalhes básicos e personalize de acordo com o tipo de evento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Type Selector */}
              <EventTypeSelector
                value={eventForm.templateKind}
                onChange={(value) => updateEventForm({ templateKind: value })}
              />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Aniversário da Maria, Casamento João & Ana"
                    value={eventForm.title}
                    onChange={(e) => updateEventForm({ title: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Conte mais sobre o evento..."
                    rows={3}
                    value={eventForm.description}
                    onChange={(e) => updateEventForm({ description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Local
                  </Label>
                  <Input
                    id="location"
                    placeholder="Endereço ou nome do local"
                    value={eventForm.location}
                    onChange={(e) => updateEventForm({ location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="startsAt" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data e Hora
                  </Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={(e) => updateEventForm({ startsAt: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Número de Convidados
                </Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateEventForm({ guests: Math.max((eventForm.guests || 0) - 1, 0) })}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={eventForm.guests || 0}
                    onChange={(e) => updateEventForm({ guests: Math.max(parseInt(e.target.value) || 0, 0) })}
                    className="w-24 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateEventForm({ guests: (eventForm.guests || 0) + 1 })}
                  >
                    +
                  </Button>
                </div>

                {/* Plan Warning */}
                <div className={`mt-3 rounded-lg border p-3 text-sm ${
                  plan.requiresPayment
                    ? 'border-warning/30 bg-warning/10 text-warning-foreground'
                    : 'border-success/30 bg-success/10 text-success-foreground'
                }`}>
                  <div className="flex items-center gap-2">
                    {plan.requiresPayment ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 text-success">🎉</div>
                    )}
                    <div>
                      <div className="font-medium">{plan.label}</div>
                      {plan.requiresPayment && (
                        <div className="text-xs opacity-80 mt-1">
                          O pagamento será solicitado ao criar o evento.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Companion Setting */}
              <div className="p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Permitir Acompanhante</Label>
                    <p className="text-sm text-muted-foreground">
                      {eventForm.allowCompanion
                        ? 'Os convidados poderão levar um acompanhante'
                        : 'Os convidados não poderão levar acompanhante'}
                    </p>
                  </div>
                  <Switch
                    checked={eventForm.allowCompanion}
                    onCheckedChange={(checked) => updateEventForm({ allowCompanion: checked })}
                  />
                </div>
              </div>

              {/* Birthday Settings */}
              {shouldShowBirthdaySettings() && (
                <BirthdaySettings
                  hasGiftList={eventForm.hasBirthdayGiftList}
                  onGiftListChange={(enabled) => updateEventForm({ hasBirthdayGiftList: enabled })}
                />
              )}

              {/* Gift List */}
              {shouldShowGiftList() && (
                <GiftListManager
                  gifts={eventForm.initialGifts}
                  onChange={(gifts) => updateEventForm({ initialGifts: gifts })}
                  eventType={eventForm.templateKind}
                />
              )}

              {/* Wedding Party */}
              {shouldShowWeddingParty() && (
                <WeddingPartyManager
                  roles={eventForm.initialRoles}
                  onChange={(roles) => updateEventForm({ initialRoles: roles })}
                />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 shadow-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando evento...
                  </>
                ) : plan.requiresPayment ? (
                  'Continuar para pagamento'
                ) : (
                  'Criar evento gratuito'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}