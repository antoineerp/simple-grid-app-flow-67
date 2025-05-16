
// Define user related types
export interface Utilisateur {
  id: number;
  identifiant_technique: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe?: string;
  date_creation?: string;
  date_modification?: string;
}
