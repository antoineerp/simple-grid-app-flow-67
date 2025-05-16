export interface ExigenceGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Exigence[];
  userId: string; // Added userId field
}

export interface Exigence {
  id: string;
  nom: string;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
  date_creation: Date;
  date_modification: Date;
  groupId?: string;
  userId: string; // Added userId field
}

export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
