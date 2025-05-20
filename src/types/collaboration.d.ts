
// Types pour les documents de collaboration
export interface Document {
  id: string;
  name: string;
  link?: string;
  groupId?: string;
  userId?: string; // Propriété userId pour l'identification de l'utilisateur
  date_creation?: Date; // Date de création
  date_modification?: Date; // Dernière date de modification
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  userId?: string; // Propriété userId pour l'identification de l'utilisateur
}
