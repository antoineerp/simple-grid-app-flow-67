
import React from 'react';
import { Input } from "@/components/ui/input";

interface UserEmailFieldProps {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserEmailField = ({ value, error, onChange }: UserEmailFieldProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="email" className="text-right text-sm">Email</label>
      <div className="col-span-3 space-y-1">
        <Input
          id="email"
          name="email"
          type="email"
          value={value}
          onChange={onChange}
          placeholder="Entrez l'email"
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

export default UserEmailField;
