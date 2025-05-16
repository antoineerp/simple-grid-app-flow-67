
export interface Document {
  id: string;
  nom: string;
  fichier_path: string | null;
  etat: 'NC' | 'PC' | 'C' | 'EX' | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  date_creation: Date;
  date_modification: Date;
  groupId?: string;
  userId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[]; // Cette propriété est requise
}
