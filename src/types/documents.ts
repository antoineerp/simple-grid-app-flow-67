
export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
}

export interface Document {
  id: string;
  nom: string;
  titre?: string;
  fichier_path: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  atteinte?: 'NC' | 'PC' | 'C' | null;
  etat?: 'NC' | 'PC' | 'C' | 'EX' | null;
  exclusion?: boolean;
  date_creation: Date | string;
  date_modification: Date | string;
  groupId?: string;
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
