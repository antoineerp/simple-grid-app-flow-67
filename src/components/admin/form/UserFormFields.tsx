
import React from 'react';
import { Input } from "@/components/ui/input";

interface UserFormFieldsProps {
  fieldErrors: {[key: string]: string};
  values: {
    nom: string;
    prenom: string;
    email: string;
    mot_de_passe: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserFormFields = ({ fieldErrors, values, onChange }: UserFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="nom" className="text-right text-sm">Nom</label>
        <div className="col-span-3 space-y-1">
          <Input
            id="nom"
            name="nom"
            value={values.nom}
            onChange={onChange}
            placeholder="Entrez le nom"
            className={`${fieldErrors.nom ? 'border-red-500' : ''}`}
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
            value={values.prenom}
            onChange={onChange}
            placeholder="Entrez le prénom"
            className={`${fieldErrors.prenom ? 'border-red-500' : ''}`}
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
            value={values.email}
            onChange={onChange}
            placeholder="Entrez l'email"
            className={`${fieldErrors.email ? 'border-red-500' : ''}`}
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
            value={values.mot_de_passe}
            onChange={onChange}
            placeholder="Entrez le mot de passe"
            className={`${fieldErrors.mot_de_passe ? 'border-red-500' : ''}`}
            minLength={6}
          />
          {fieldErrors.mot_de_passe && (
            <p className="text-xs text-red-500">{fieldErrors.mot_de_passe}</p>
          )}
          <p className="text-xs text-gray-500">Minimum 6 caractères</p>
        </div>
      </div>
    </>
  );
};

export default UserFormFields;
