
import React from 'react';
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';

interface UserFormFieldsProps {
  formData: any;
  fieldErrors: {[key: string]: string};
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hasManager: boolean;
  connectAfterCreate: boolean;
  setConnectAfterCreate: (value: boolean) => void;
  isSubmitting: boolean;
}

export const UserFormFields = ({
  formData,
  fieldErrors,
  handleChange,
  hasManager,
  connectAfterCreate,
  setConnectAfterCreate,
  isSubmitting
}: UserFormFieldsProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="nom" className="text-right text-sm">Nom</label>
        <div className="col-span-3 space-y-1">
          <Input
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            className={`${fieldErrors.nom ? 'border-red-500' : ''}`}
            required
          />
          {fieldErrors.nom && (
            <p className="text-xs text-red-500">{fieldErrors.nom}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="prenom" className="text-right text-sm">Prénom</label>
        <div className="col-span-3 space-y-1">
          <Input
            id="prenom"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            className={`${fieldErrors.prenom ? 'border-red-500' : ''}`}
            required
          />
          {fieldErrors.prenom && (
            <p className="text-xs text-red-500">{fieldErrors.prenom}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="email" className="text-right text-sm">Email</label>
        <div className="col-span-3 space-y-1">
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`${fieldErrors.email ? 'border-red-500' : ''}`}
            required
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="mot_de_passe" className="text-right text-sm">Mot de passe</label>
        <div className="col-span-3 space-y-1">
          <Input
            id="mot_de_passe"
            name="mot_de_passe"
            type="password"
            value={formData.mot_de_passe}
            onChange={handleChange}
            className={`${fieldErrors.mot_de_passe ? 'border-red-500' : ''}`}
            required
            minLength={6}
          />
          {fieldErrors.mot_de_passe && (
            <p className="text-xs text-red-500">{fieldErrors.mot_de_passe}</p>
          )}
          <p className="text-xs text-gray-500">Minimum 6 caractères</p>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="role" className="text-right text-sm">Rôle</label>
        <div className="col-span-3 space-y-1">
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`flex h-10 w-full rounded-md border ${fieldErrors.role ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            required
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="gestionnaire" disabled={hasManager}>Gestionnaire {hasManager ? '(Limite atteinte)' : ''}</option>
            <option value="admin">Administrateur</option>
          </select>
          {fieldErrors.role && (
            <p className="text-xs text-red-500">{fieldErrors.role}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="connect" className="text-right text-sm">Options</label>
        <div className="col-span-3 flex items-center space-x-2">
          <input
            type="checkbox"
            id="connect"
            checked={connectAfterCreate}
            onChange={() => setConnectAfterCreate(!connectAfterCreate)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="connect" className="text-sm text-gray-700">
            Se connecter automatiquement après la création
          </label>
        </div>
      </div>
    </div>
  );
};
