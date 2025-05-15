
/**
 * Types pour la bibliothèque de documents
 */

export interface BibliothequeDocument {
  id: string;
  titre: string;
  description?: string;
  groupe_id?: string;
  fichier_url?: string;
  date_creation?: string;
  date_modification?: string;
  created_by?: string;
  modified_by?: string;
  etat?: 'actif' | 'archive' | 'brouillon';
  tags?: string[];
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
