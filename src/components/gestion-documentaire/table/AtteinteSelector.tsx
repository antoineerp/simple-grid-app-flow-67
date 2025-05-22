
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AtteinteSelectorProps {
  value: 'NC' | 'PC' | 'C' | 'EX' | null;
  onChange: (value: 'NC' | 'PC' | 'C' | null) => void;
  disabled?: boolean;
}

const AtteinteSelector: React.FC<AtteinteSelectorProps> = ({ 
  value, 
  onChange,
  disabled = false
}) => {
  const handleChange = (val: string) => {
    if (val === 'NC' || val === 'PC' || val === 'C' || val === null) {
      onChange(val as 'NC' | 'PC' | 'C' | null);
    }
  };

  const getStatusLabel = () => {
    switch (value) {
      case 'NC':
        return 'Non conforme';
      case 'PC':
        return 'Partiellement conforme';
      case 'C':
        return 'Conforme';
      case 'EX':
        return 'Exclu';
      default:
        return 'Non évalué';
    }
  };

  const getStatusColor = () => {
    switch (value) {
      case 'NC':
        return 'text-red-600 border-red-300';
      case 'PC':
        return 'text-amber-600 border-amber-300';
      case 'C':
        return 'text-green-600 border-green-300';
      case 'EX':
        return 'text-gray-400 border-gray-300';
      default:
        return 'text-gray-500 border-gray-300';
    }
  };

  return (
    <Select 
      value={value || "none"} 
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className={`w-full h-8 px-2 text-sm font-medium ${getStatusColor()} ${disabled ? 'opacity-60' : ''}`}
      >
        <SelectValue placeholder="Non évalué">
          {getStatusLabel()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Non évalué</SelectItem>
        <SelectItem value="NC" className="text-red-600">Non conforme</SelectItem>
        <SelectItem value="PC" className="text-amber-600">Partiellement conforme</SelectItem>
        <SelectItem value="C" className="text-green-600">Conforme</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default AtteinteSelector;
