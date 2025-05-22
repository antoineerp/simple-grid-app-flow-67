
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AtteinteSelectorProps {
  value: 'NC' | 'PC' | 'C' | null;
  onChange: (value: 'NC' | 'PC' | 'C' | null) => void;
  disabled?: boolean;
}

const AtteinteSelector: React.FC<AtteinteSelectorProps> = ({ value, onChange, disabled = false }) => {
  
  // Obtenir l'étiquette et la couleur en fonction de la valeur
  const getLabel = (val: string | null) => {
    switch (val) {
      case 'NC':
        return 'Non Conforme';
      case 'PC':
        return 'Partiellement Conforme';
      case 'C':
        return 'Conforme';
      default:
        return 'Non évalué';
    }
  };
  
  const getColor = (val: string | null) => {
    switch (val) {
      case 'NC':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      case 'PC':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      case 'C':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };
  
  const handleChange = (newValue: string) => {
    if (newValue === 'null') {
      onChange(null);
    } else {
      onChange(newValue as 'NC' | 'PC' | 'C');
    }
  };
  
  return (
    <Select
      value={value === null ? 'null' : value}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Non évalué">
          <Badge className={`${getColor(value)} font-medium`}>
            {getLabel(value)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="null">
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
            Non évalué
          </Badge>
        </SelectItem>
        <SelectItem value="NC">
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            Non Conforme
          </Badge>
        </SelectItem>
        <SelectItem value="PC">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
            Partiellement Conforme
          </Badge>
        </SelectItem>
        <SelectItem value="C">
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            Conforme
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default AtteinteSelector;
