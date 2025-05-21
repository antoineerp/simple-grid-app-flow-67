
import React from 'react';
import { User, UserPlus } from 'lucide-react';
import { useMembres } from '@/contexts/MembresContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResponsableSelectorProps {
  selectedInitiales: string[];
  onChange: (initiales: string[]) => void;
  type: 'r' | 'a' | 'c' | 'i';
}

const ResponsableSelector = ({ selectedInitiales, onChange, type }: ResponsableSelectorProps) => {
  const { membres } = useMembres();

  const handleToggleMembre = (initiales: string) => {
    if (selectedInitiales.includes(initiales)) {
      onChange(selectedInitiales.filter(i => i !== initiales));
    } else {
      onChange([...selectedInitiales, initiales]);
    }
  };

  // S'assurer qu'on a des données par défaut si les membres sont vides ou en cours de chargement
  const membresData = membres && membres.length > 0 ? membres : [
    { id: '1', prenom: 'Jean', nom: 'Dupont', initiales: 'JD', fonction: 'Directeur', date_creation: new Date() },
    { id: '2', prenom: 'Marie', nom: 'Martin', initiales: 'MM', fonction: 'Responsable', date_creation: new Date() }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-center p-1 hover:bg-gray-100 rounded">
          {selectedInitiales.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedInitiales.map((initiale) => (
                <span key={initiale} className="bg-app-blue text-white text-xs px-1.5 py-0.5 rounded">
                  {initiale}
                </span>
              ))}
            </div>
          ) : (
            <UserPlus className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="text-sm font-medium mb-2">
          {type === 'r' ? 'Responsable' : type === 'a' ? 'Approbateur' : type === 'c' ? 'Consulté' : 'Informé'}
        </div>
        <div className="max-h-48 overflow-y-auto">
          {membresData.map((membre) => (
            <div 
              key={membre.id} 
              className="flex items-center justify-between p-1.5 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => handleToggleMembre(membre.initiales)}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{membre.prenom} {membre.nom}</span>
              </div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                selectedInitiales.includes(membre.initiales) 
                  ? 'bg-app-blue text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {membre.initiales}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ResponsableSelector;
