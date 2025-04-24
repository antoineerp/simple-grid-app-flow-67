
import React from 'react';
import { Input } from "@/components/ui/input";

interface UserFirstNameFieldProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserFirstNameField = ({ value, error, onChange }: UserFirstNameFieldProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="prenom" className="text-right text-sm">Prénom</label>
      <div className="col-span-3 space-y-1">
        <Input
          id="prenom"
          name="prenom"
          value={value}
          onChange={onChange}
          placeholder="Entrez le prénom"
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

export default UserFirstNameField;
