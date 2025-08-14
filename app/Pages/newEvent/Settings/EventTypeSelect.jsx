import { Label } from "@/components/ui/label";
import { Calendar, Heart, Gift, User, Sparkles } from "lucide-react";

/**
 * @typedef {Object} EventTypeSelectorProps
 * @property {string} value
 * @property {(value: string) => void} onChange
 */

const eventTypes = [
  {
    value: "default",
    label: "Evento Padrão",
    description: "Evento genérico simples",
    icon: Calendar,
    color: "from-blue-500 to-blue-600"
  },
  {
    value: "aniversario", 
    label: "Aniversário",
    description: "Festa de aniversário com opção de lista de presentes",
    icon: Gift,
    color: "from-purple-500 to-pink-500"
  },
  {
    value: "casamento",
    label: "Casamento", 
    description: "Cerimônia de casamento com padrinhos e lista de presentes",
    icon: Heart,
    color: "from-rose-400 to-pink-500"
  },
  {
    value: "outros",
    label: "Outros",
    description: "Evento personalizado",
    icon: Sparkles,
    color: "from-indigo-500 to-purple-500"
  }
];
/**
 * @param {EventTypeSelectorProps} props
 */
export function EventTypeSelector({ value, onChange }) {
  return (
    <div>
      <Label className="text-sm font-medium text-foreground mb-3 block">
        Tipo de Evento
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {eventTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          
          return (
            <div
              key={type.value}
              onClick={() => onChange(type.value)}
              className={`
                relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                ${isSelected 
                  ? 'border-primary bg-accent shadow-medium' 
                  : 'border-border bg-card hover:border-accent-foreground/50 hover:shadow-soft'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${type.color}
                `}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{type.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}