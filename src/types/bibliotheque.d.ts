
export interface Document {
  id: string;
  name: string;
  link?: string;
  groupId?: string;
  userId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: string[];
  userId?: string;
}

export interface BibliothequeItem {
  id: string;
  name: string;
  link?: string;
  groupId?: string;
  userId?: string;
}
