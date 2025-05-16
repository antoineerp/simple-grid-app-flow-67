
export interface Responsabilites {
  r: string[];
  a: string[];
  c: string[];
  i: string[];
}

export interface Exigence {
  id: string;
  nom: string;
  description?: string;
  critere?: string;
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
  responsabilites: Responsabilites;
  groupId?: string;
  // Add missing properties that are being used in components
  userId?: string;
  date_creation?: Date;
  date_modification?: Date;
}

export interface ExigenceGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Exigence[]; // Cette propriété est requise
  userId?: string; // Adding userId that's being used in components
}

// Add ExigenceStats interface that's referenced in several files
export interface ExigenceStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
