
/**
 * Type pour les documents de pilotage
 */
export interface PilotageDocument {
  id: string;
  nom: string;
  ordre: number;
  lien: string | null;
  fichier_path?: string | null;
  responsabilites?: { r: string[], a: string[], c: string[], i: string[] };
  etat?: 'NC' | 'PC' | 'C' | 'EX' | null;
  date_creation?: Date;
  date_modification?: Date;
}
