
export interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role?: string;
  departement?: string;
  fonction?: string;
  initiales?: string;
  date_creation?: Date;
  date_modification?: Date;
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  actif?: boolean;
  userId?: string; // ID de l'utilisateur propriétaire
}

export interface MembresStats {
  total: number;
  parDepartement: { [departement: string]: number };
  parRole: { [role: string]: number };
}
