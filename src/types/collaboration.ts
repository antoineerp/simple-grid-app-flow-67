
export interface Document {
  id: string;
  titre: string;
  description?: string;
  url?: string;
  type?: string;
  tags?: string[] | string;
  date_creation: Date | string;
  date_modification?: Date | string;
  [key: string]: any;
}

export interface DocumentGroup {
  id: string;
  name: string;
  items: Document[];
  [key: string]: any;
}
