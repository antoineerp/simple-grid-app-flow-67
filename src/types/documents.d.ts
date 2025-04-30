
export interface Document {
  id: string;
  processId?: string;
  name: string;
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
  link?: string;
  groupId?: string;
  excluded?: boolean;
  atteinte?: 'NC' | 'PC' | 'C' | null;
  ordre?: number;
  userId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  ordre?: number;
  userId?: string;
}
