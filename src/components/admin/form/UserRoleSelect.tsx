
import React from 'react';
import { FormField } from "@/components/ui/form";
import { UserRole } from '@/types/roles';

interface UserRoleSelectProps {
  hasManager: boolean;
  fieldErrors: {[key: string]: string};
  value: UserRole;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const UserRoleSelect = ({ hasManager, fieldErrors, value, onChange }: UserRoleSelectProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <label htmlFor="role" className="text-right text-sm">Rôle</label>
      <div className="col-span-3 space-y-1">
        <select
          id="role"
          name="role"
          value={value}
          onChange={onChange}
          className={`flex h-10 w-full rounded-md border ${fieldErrors.role ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
          required
        >
          <option value="utilisateur">Utilisateur</option>
          <option value="gestionnaire" disabled={hasManager}>
            Gestionnaire {hasManager ? '(Limite atteinte)' : ''}
          </option>
          <option value="administrateur">Administrateur</option>
        </select>
        {fieldErrors.role && (
          <p className="text-xs text-red-500">{fieldErrors.role}</p>
        )}
      </div>
    </div>
  );
};

export default UserRoleSelect;
