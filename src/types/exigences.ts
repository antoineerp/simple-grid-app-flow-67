
export interface Exigence {
  id: string;
  nom: string;
  description?: string;
  responsabilites?: {
    r?: string[];
    a?: string[];
    c?: string[];
    i?: string[];
    responsable?: string;
    approbateur?: string;
    consultant?: string;
    informe?: string;
  };
  exclusion?: boolean;
  atteinte?: 'NC' | 'PC' | 'C' | 'non_conforme' | 'partiellement_conforme' | 'conforme' | null;
  groupId?: string;
  ordre?: number;
  date_creation?: Date;
  date_modification?: Date;
}

export interface ExigenceGroup {
  id: string;
  nom: string;
  name?: string; // alias pour compatibilité
  description?: string;
  ordre?: number;
  expanded?: boolean;
  items?: any[];
}

export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
