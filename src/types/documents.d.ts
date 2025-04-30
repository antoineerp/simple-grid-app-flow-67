
export interface Document {
  id: string;
  processId?: string;
  name?: string;
  nom?: string;  // Pour compatibilité avec les anciennes données
  numero?: string;
  reference?: string;
  type?: string;
  responsable?: string[];
  approbateur?: string[];
  consulte?: string[];
  informe?: string[];
  version?: string;
  statut?: string;
  etat?: string;  // Pour compatibilité avec les anciennes données
  date_publication?: string;
  date_prochaine_revision?: string;
  file?: File;
  link?: string;
  fichier_path?: string;  // Pour compatibilité avec les anciennes données
  groupId?: string;
  excluded?: boolean;
  atteinte?: 'NC' | 'PC' | 'C' | null;
  ordre?: number;
  userId?: string;
  responsabilites?: { r: string[], a: string[], c: string[], i: string[] };
  date_creation?: Date;
  date_modification?: Date;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  ordre?: number;
  userId?: string;
}
