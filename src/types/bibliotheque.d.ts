
// Types pour la bibliothèque de documents
export interface Document {
  id: string;
  name: string;
  link?: string;
  groupId?: string;
  userId?: string; // Added userId property for user identification
  date_creation?: Date; // Date of creation
  date_modification?: Date; // Last modification date
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  userId?: string; // Added userId property for user identification
}
