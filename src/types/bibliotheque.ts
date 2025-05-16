
// Définition des types pour la bibliothèque de documents

export interface Document {
  id: string;
  name: string; // Changed from nom to name for consistency
  link?: string | null; // Changed from lien to link for consistency
  dateAjout?: Date;
  dateModification?: Date;
  groupId?: string;
  userId: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[]; // Propriété requise pour tous les groupes
  userId: string;
}
