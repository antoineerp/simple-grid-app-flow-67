
import React, { useState } from 'react';
import { User, UserPlus, Check, X } from 'lucide-react';
import { useMembres } from '@/contexts/MembresContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Membre } from '@/types/membres';

interface ResponsableSelectorProps {
  selectedInitiales: string[];
  onChange: (initiales: string[]) => void;
  type: 'r' | 'a' | 'c' | 'i';
  disabled?: boolean;
}

const ResponsableSelector = ({ 
  selectedInitiales, 
  onChange, 
  type,
  disabled = false
}: ResponsableSelectorProps) => {
  const { membres } = useMembres();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleMembre = (initiales: string) => {
    if (disabled) return;
    if (selectedInitiales.includes(initiales)) {
      onChange(selectedInitiales.filter(i => i !== initiales));
    } else {
      onChange([...selectedInitiales, initiales]);
    }
  };

  // S'assurer qu'on a des données par défaut si les membres sont vides ou en cours de chargement
  const membresData: Membre[] = membres && membres.length > 0 ? membres : [
    { id: '1', prenom: 'Jean', nom: 'Dupont', initiales: 'JD', fonction: 'Directeur', date_creation: new Date() },
    { id: '2', prenom: 'Marie', nom: 'Martin', initiales: 'MM', fonction: 'Responsable', date_creation: new Date() }
  ];

  const filteredMembres = searchTerm
    ? membresData.filter(m => 
        m.prenom.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.initiales.toLowerCase().includes(searchTerm.toLowerCase()))
    : membresData;

  const getRoleTitle = () => {
    switch(type) {
      case 'r': return 'Responsable';
      case 'a': return 'Approbateur';
      case 'c': return 'Consulté';
      case 'i': return 'Informé';
      default: return '';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex flex-wrap gap-1 cursor-pointer min-h-6">
          {selectedInitiales.length > 0 ? (
            selectedInitiales.map((initiale) => (
              <Badge 
                key={initiale}
                variant="outline" 
                className="bg-app-blue text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                onClick={(e) => {
                  if (!disabled) {
                    e.stopPropagation();
                    setIsOpen(true);
                  }
                }}
              >
                {initiale}
              </Badge>
            ))
          ) : (
            <button 
              className={`flex items-center justify-center p-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} rounded`} 
              disabled={disabled}
            >
              <UserPlus className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-64 p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">{getRoleTitle()}</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          <div className="max-h-48 overflow-y-auto">
            {filteredMembres.map((membre) => (
              <div 
                key={membre.id} 
                className="flex items-center justify-between p-1.5 hover:bg-gray-100 cursor-pointer rounded"
                onClick={() => handleToggleMembre(membre.initiales)}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="truncate max-w-[150px]">{membre.prenom} {membre.nom}</span>
                </div>
                <Badge className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  selectedInitiales.includes(membre.initiales) 
                    ? 'bg-app-blue text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {membre.initiales}
                  {selectedInitiales.includes(membre.initiales) && (
                    <Check className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              </div>
            ))}
            {filteredMembres.length === 0 && (
              <div className="text-center text-gray-500 py-2">Aucun résultat</div>
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default ResponsableSelector;
