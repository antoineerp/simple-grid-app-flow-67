
export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  userId: string; // Ajout de userId comme requis
  ordre?: number;
}

export interface Document {
  id: string;
  nom: string;
  fichier_path: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: 'NC' | 'PC' | 'C' | 'EX' | null;
  date_creation: Date;
  date_modification: Date;
  groupId?: string;
  userId: string; // Ajout de userId comme requis
  excluded?: boolean; // Ajout de la propriété excluded
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
