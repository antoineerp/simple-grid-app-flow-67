
export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
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
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
