
export interface ExigenceGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Exigence[];
}

export interface Exigence {
  id: string;
  nom: string;
  code?: string;
  titre?: string;
  description?: string;
  niveau?: string;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
  date_creation: Date | string;
  date_modification: Date | string;
  groupId?: string;
  documents_associes?: any[];
}

export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}

// Type for document references
export interface Documents {
  id: string;
  titre: string;
  url?: string;
}
