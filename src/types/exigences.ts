
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
}

export interface ExigenceGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Exigence[]; // Cette propriété est requise
}
