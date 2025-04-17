
export interface Document {
  id: string;
  nom: string;
  type?: string;
  date_creation: Date;
  date_modification: Date;
  contenu?: string;
  fichier_path?: string;
  createur_id?: string;
  etat?: 'NC' | 'PC' | 'C' | 'EX';
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
}

export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
