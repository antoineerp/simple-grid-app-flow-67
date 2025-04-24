
import React from 'react';
import { Input } from "@/components/ui/input";

interface UserPasswordFieldProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserPasswordField = ({ value, error, onChange }: UserPasswordFieldProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="mot_de_passe" className="text-right text-sm">Mot de passe</label>
      <div className="col-span-3 space-y-1">
        <Input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          value={value}
          onChange={onChange}
          placeholder="Entrez le mot de passe"
          className={`${error ? 'border-red-500' : ''}`}
          minLength={6}
          autoComplete="new-password"
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <p className="text-xs text-gray-500">Minimum 6 caractères</p>
      </div>
    </div>
  );
};

export default UserPasswordField;
