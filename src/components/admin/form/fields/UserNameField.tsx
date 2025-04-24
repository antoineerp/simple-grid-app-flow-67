
import React from 'react';
import { Input } from "@/components/ui/input";

interface UserNameFieldProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserNameField = ({ value, error, onChange }: UserNameFieldProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="nom" className="text-right text-sm">Nom</label>
      <div className="col-span-3 space-y-1">
        <Input
          id="nom"
          name="nom"
          value={value}
          onChange={onChange}
          placeholder="Entrez le nom"
          className={`${error ? 'border-red-500' : ''}`}
          autoComplete="off"
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default UserNameField;
