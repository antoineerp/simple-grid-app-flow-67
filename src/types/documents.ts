
export interface Document {
  id: string;
  name?: string;           // Made optional since some components use nom instead
  nom?: string;           // Propriété utilisée dans certains composants
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
  fichier_path?: string | null;  // Ajout de cette propriété
  date_creation?: Date;          // Ajout de cette propriété
  date_modification?: Date;      // Ajout de cette propriété
  processId?: string;
  numero?: string;
  reference?: string;
  type?: string;
  responsable?: string[];
  approbateur?: string[];
  consulte?: string[];
  informe?: string[];
  version?: string;
  statut?: string;
  date_publication?: string;
  date_prochaine_revision?: string;
  file?: File;
  excluded?: boolean;
  atteinte?: 'NC' | 'PC' | 'C' | null;
  ordre?: number;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  userId?: string;
  items?: Document[];  // Ajout de cette propriété
  ordre?: number;
}

// Ajout de l'interface DocumentStats manquante
export interface DocumentStats {
  exclusion: number;
  nonConforme: number;
  partiellementConforme: number;
  conforme: number;
  total: number;
}
