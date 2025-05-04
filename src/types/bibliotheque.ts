
export interface Document {
  id: string;
  name: string;
  link: string | null;
  groupId?: string;
  userId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: Document[];
  userId?: string;
}
