import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Gift, Cake } from "lucide-react";

/**
 * @param {{ hasGiftList: boolean, onGiftListChange: (enabled: boolean) => void }} props
 */
export function BirthdaySettings({ hasGiftList, onGiftListChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cake className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold text-foreground">
          Configurações do Aniversário
        </Label>
      </div>
      
      <div className="p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="gift-list-toggle" className="font-medium">
                Lista de Presentes
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasGiftList 
                ? 'Os convidados verão uma lista de presentes sugeridos'
                : 'A página não mostrará lista de presentes'
              }
            </p>
          </div>
          <Switch
            id="gift-list-toggle"
            checked={hasGiftList}
            onCheckedChange={onGiftListChange}
          />
        </div>
      </div>
    </div>
  );
}