import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Gift } from "lucide-react";

export function GiftListManager({ gifts, onChange, eventType }) {
  const addGift = () => {
    onChange([...gifts, { title: '', link: '', priceCents: '' }]);
  };

  const removeGift = (index) => {
    onChange(gifts.filter((_, i) => i !== index));
  };

  const updateGift = (index, field, value) => {
    const updatedGifts = gifts.map((gift, i) => 
      i === index ? { ...gift, [field]: value } : gift
    );
    onChange(updatedGifts);
  };

  const formatPrice = (priceCents) => {
    if (!priceCents) return '';
    const price = parseInt(priceCents) / 100;
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold text-foreground">
          Lista de Presentes
        </Label>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {eventType === 'casamento' 
          ? 'Adicione os presentes que os convidados podem oferecer aos noivos.'
          : 'Adicione os presentes que gostaria de receber.'}
      </p>

      <div className="space-y-3">
        {gifts.map((gift, index) => (
          <div key={index} className="p-4 border border-border rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Presente #{index + 1}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeGift(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-sm">Título do presente</Label>
                <Input
                  placeholder="Ex: Jogo de panelas"
                  value={gift.title}
                  onChange={(e) => updateGift(index, 'title', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Link (opcional)</Label>
                <Input
                  placeholder="https://..."
                  value={gift.link || ''}
                  onChange={(e) => updateGift(index, 'link', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Preço estimado</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="19990"
                    value={gift.priceCents || ''}
                    onChange={(e) => updateGift(index, 'priceCents', e.target.value.replace(/\D/g, ''))}
                  />
                  {gift.priceCents && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPrice(gift.priceCents)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addGift}
        className="w-full border-dashed border-primary/50 text-primary hover:bg-accent"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar presente
      </Button>
      
      <p className="text-xs text-muted-foreground">
        💡 Dica: O preço deve ser em centavos (ex: R$ 199,90 = 19990)
      </p>
    </div>
  );
}