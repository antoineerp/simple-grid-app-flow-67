
export interface Exigence {
  id: number;
  nom: string;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
}

export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
