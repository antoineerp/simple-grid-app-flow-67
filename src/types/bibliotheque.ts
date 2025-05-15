
// Types pour la bibliothèque de documents
export interface Document {
  id: string;
  name: string;
  link?: string;
  groupId?: string;
  userId: string;
  date_creation?: Date;
  date_modification?: Date;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  userId: string;
}

// Types pour la bibliothèque
export interface BibliothequeDocument {
  id: string;
  name: string;  // Adding name property
  titre: string;
  type: string;
  size: number;
  folderId: string | null;  // Adding folderId property
  tags?: string[];
  description?: string;
  groupe_id?: string;
  fichier_url?: string;
  date_creation?: string;
  date_modification?: string;
  created_by?: string;
  modified_by?: string;
  etat?: 'actif' | 'archive' | 'brouillon';
  createdAt?: Date;  // Adding createdAt property
  updatedAt?: Date;  // Adding updatedAt property
}

export interface BibliothequeFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface BibliothequeGroup {
  id: string;
  nom: string;
  description?: string;
  ordre?: number;
  parent_id?: string;
  couleur?: string;
}

export interface BibliothequeStats {
  totalDocuments: number;
  totalGroups: number;
  documentsParGroupe: { [groupId: string]: number };
  documentsPourcentage: number;
}

export interface BibliothequeSearchOptions {
  term?: string;
  groupe?: string;
  etat?: 'actif' | 'archive' | 'brouillon';
  tags?: string[];
  dateDebut?: string;
  dateFin?: string;
}
