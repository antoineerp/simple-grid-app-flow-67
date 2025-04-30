
export interface Utilisateur {
  id: string;
  identifiant_technique: string;
  email: string;
  nom?: string;
  prenom?: string;
  role?: string;
  actif?: boolean;
  derniere_connexion?: string;
  date_creation?: string;
  mot_de_passe?: string; // Added this field
}

export interface CreateUserParams {
  identifiant_technique: string; // Doit commencer par p71x6d_
  email: string;
  password: string;
  nom?: string;
  prenom?: string;
  role?: string;
}

export interface UpdateUserParams {
  id: string;
  email?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  actif?: boolean;
  password?: string;
}
