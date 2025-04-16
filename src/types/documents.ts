
export interface Document {
  id: number;
  nom: string;
  lien: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: 'NC' | 'PC' | 'C' | 'EX' | null;
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
