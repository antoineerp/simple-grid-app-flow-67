
export interface Document {
  id: string;
  name: string;
  link: string;
  userId: string;
  groupId?: string;
}

export interface DocumentGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: string[]; // IDs of documents in this group
  userId: string;
}
