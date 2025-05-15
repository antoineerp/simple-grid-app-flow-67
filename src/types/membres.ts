
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
  telephone?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  actif?: boolean;
}

export interface MembresStats {
  total: number;
  parDepartement: { [departement: string]: number };
  parRole: { [role: string]: number };
}
