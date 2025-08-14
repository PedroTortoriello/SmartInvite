import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Users } from "lucide-react";

export function WeddingPartyManager({ roles, onChange }) {
  const addRole = () => {
    onChange([...roles, { role: 'padrinho', name: '' }]);
  };

  const removeRole = (index) => {
    onChange(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index, field, value) => {
    const updatedRoles = roles.map((role, i) => 
      i === index ? { ...role, [field]: value } : role
    );
    onChange(updatedRoles);
  };

  const padrinhos = roles.filter(r => r.role === 'padrinho');
  const madrinhas = roles.filter(r => r.role === 'madrinha');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold text-foreground">
          Padrinhos e Madrinhas
        </Label>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Adicione os padrinhos e madrinhas que farão parte da cerimônia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Padrinhos */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
            Padrinhos ({padrinhos.length})
          </h4>
          {padrinhos.map((_, index) => {
            const roleIndex = roles.findIndex(r => r === padrinhos[index]);
            return (
              <div key={roleIndex} className="flex gap-2">
                <Input
                  placeholder="Nome do padrinho"
                  value={roles[roleIndex].name}
                  onChange={(e) => updateRole(roleIndex, 'name', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRole(roleIndex)}
                  className="h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Madrinhas */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500"></div>
            Madrinhas ({madrinhas.length})
          </h4>
          {madrinhas.map((_, index) => {
            const roleIndex = roles.findIndex(r => r === madrinhas[index]);
            return (
              <div key={roleIndex} className="flex gap-2">
                <Input
                  placeholder="Nome da madrinha"
                  value={roles[roleIndex].name}
                  onChange={(e) => updateRole(roleIndex, 'name', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => removeRole(roleIndex)}
                  className="h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...roles, { role: 'padrinho', name: '' }])}
          className="flex-1 border-dashed border-blue-500/50 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Padrinho
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...roles, { role: 'madrinha', name: '' }])}
          className="flex-1 border-dashed border-pink-500/50 text-pink-600 hover:bg-pink-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Madrinha
        </Button>
      </div>
    </div>
  );
}
