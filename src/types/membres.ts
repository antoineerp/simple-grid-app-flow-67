
export interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction: string;
  organisation?: string;
  notes?: string;
  initiales: string;
  date_creation: Date;
  identifiant_technique?: string;
  role?: string;
  mot_de_passe?: string;
}
