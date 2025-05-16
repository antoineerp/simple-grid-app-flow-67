
export interface Document {
  id: string;
  nom: string;
  fichier_path: string | null;
  etat: 'NC' | 'PC' | 'C' | 'EX' | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  date_creation: Date;
  date_modification: Date;
  groupId?: string;
  userId?: string;
  // Add missing properties used by components
  name?: string;
  link?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[]; // Cette propriété est requise
  userId?: string; // Adding userId that's being used in components
}

// Add DocumentStats interface that's referenced in several files
export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
