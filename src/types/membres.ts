
export interface Membre {
  id: string;  // Changed from number to string to match database ID
  nom: string;
  prenom: string;
  email?: string;  // Optional, as it's not in the original type
  fonction: string;
  initiales: string;
  date_creation: Date;  // Added to match the database schema
  identifiant_technique?: string;  // Optional, from database schema
  role?: string;  // Optional role from database
  mot_de_passe?: string;  // Optional password field
}
