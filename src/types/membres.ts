
export interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  fonction: string;
  initiales: string;
  date_creation: Date;
  identifiant_technique?: string;
  role?: string;
  mot_de_passe: string;  // Ajout du champ mot_de_passe
}

