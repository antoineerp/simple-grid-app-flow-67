
export interface Document {
  id: string;
  name: string;
  link?: string | null;
  groupId?: string;
  userId?: string;
  etat?: 'NC' | 'PC' | 'C' | 'EX' | null;
  responsabilites?: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  userId?: string;
}
