
export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
}

export interface Document {
  id: string;
  nom: string;
  name?: string; // Adding name property for compatibility
  fichier_path: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: 'NC' | 'PC' | 'C' | 'EX' | null;
  statut?: string; // Adding statut property for compatibility
  date_creation: Date;
  date_modification: Date;
  groupId?: string;
  excluded?: boolean; // Adding excluded property
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
