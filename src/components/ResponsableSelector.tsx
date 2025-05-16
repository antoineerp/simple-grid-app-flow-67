
import React from 'react';
import { User, UserPlus } from 'lucide-react';
import { useMembres } from '@/contexts/MembresContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ResponsableSelectorProps {
  selectedInitiales: string[];
  onChange: (initiales: string[]) => void;
  type: 'r' | 'a' | 'c' | 'i';
}

const defaultMembres = [
  { id: '1', prenom: 'Jean', nom: 'Dupont', initiales: 'JD' },
  { id: '2', prenom: 'Marie', nom: 'Martin', initiales: 'MM' },
  { id: '3', prenom: 'Pierre', nom: 'Bernard', initiales: 'PB' },
  { id: '4', prenom: 'Sophie', nom: 'Petit', initiales: 'SP' },
];

const ResponsableSelector = ({ selectedInitiales, onChange, type }: ResponsableSelectorProps) => {
  // Récupérer les membres du contexte s'il est disponible, sinon utiliser les valeurs par défaut
  let membres = defaultMembres;
  let contextAvailable = false;
  
  try {
    const membresContext = useMembres();
    if (membresContext && membresContext.membres && membresContext.membres.length > 0) {
      membres = membresContext.membres;
      contextAvailable = true;
    }
  } catch (error) {
    console.warn("Contexte MembresProvider non disponible, utilisation des membres par défaut");
    // Déjà initialisé avec defaultMembres
  }

  const handleToggleMembre = (initiales: string) => {
    if (selectedInitiales.includes(initiales)) {
      onChange(selectedInitiales.filter(i => i !== initiales));
    } else {
      onChange([...selectedInitiales, initiales]);
    }
  };

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
          {!contextAvailable && (
            <span className="text-xs text-amber-500 ml-1">(mode hors ligne)</span>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto">
          {membres.map((membre) => (
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
