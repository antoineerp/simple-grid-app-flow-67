
export interface Exigence {
  id: string;
  code?: string;
  titre?: string;
  nom?: string;
  description?: string;
  niveau?: string;
  atteinte: 'NC' | 'PC' | 'C' | null;
  exclusion: boolean;
  documents_associes?: any[];
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  date_creation: Date | string;
  date_modification: Date | string;
  groupId?: string;
}

export interface ExigenceGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: string[];
}

export interface ExigenceStats {
  total: number;
  conforme: number;
  partiellementConforme: number;
  nonConforme: number;
  exclusion: number;
}
