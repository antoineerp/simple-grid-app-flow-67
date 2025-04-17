
export interface Exigence {
  id: string;
  nom: string;
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
  date_creation: Date;
  date_modification: Date;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
}

export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
