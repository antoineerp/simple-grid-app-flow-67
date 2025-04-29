
export interface Document {
  id: string;
  titre?: string;
  nom?: string;
  description?: string;
  fichier_path?: string | null;
  date_creation: Date | string;
  date_modification: Date | string;
  responsabilites?: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  atteinte?: 'NC' | 'PC' | 'C' | null;
  etat?: 'NC' | 'PC' | 'C' | 'EX' | null;
  exclusion?: boolean;
  groupId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: string[];
}

export interface DocumentStats {
  total: number;
  conforme: number;
  partiellementConforme: number;
  nonConforme: number;
  exclusion: number;
}
