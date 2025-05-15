
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dispatch, SetStateAction } from 'react';

interface MembresToolbarProps {
  searchTerm: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  departments: string[];
  selectedDepartment: string | null;
  onDepartmentChange: Dispatch<SetStateAction<string | null>>;
}

const MembresToolbar: React.FC<MembresToolbarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  departments, 
  selectedDepartment, 
  onDepartmentChange 
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <Input
        placeholder="Rechercher un membre..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      
      <Select
        value={selectedDepartment || ""}
        onValueChange={(value) => onDepartmentChange(value || null)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Département" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les départements</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MembresToolbar;
