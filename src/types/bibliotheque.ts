
// Définition des types pour la bibliothèque de documents

export interface Document {
  id: string;
  nom: string;
  lien: string | null;
  dateAjout: Date;
  dateModification: Date;
  groupId?: string;
  userId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[]; // Propriété requise pour tous les groupes
}
