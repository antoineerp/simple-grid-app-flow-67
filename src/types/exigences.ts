
export interface Exigence {
  id: string;
  nom: string;
  description?: string;
  responsabilites?: {
    responsable?: string;
    approbateur?: string;
    consultant?: string;
    informe?: string;
  };
  exclusion?: boolean;
  atteinte?: 'non_conforme' | 'partiellement_conforme' | 'conforme';
  groupId?: string;
  ordre?: number;
  date_creation?: Date;
  date_modification?: Date;
}

export interface ExigenceGroup {
  id: string;
  nom: string;
  description?: string;
  ordre?: number;
  expanded?: boolean;
}
