
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}

export interface DatabaseResponse {
  status: 'success' | 'error';
  message?: string;
  error?: string;
  info?: {
    host: string;
    database_name: string;
    size: string;
    table_count: number;
    last_backup: string;
    encoding?: string;
    collation?: string;
    tables?: string[];
  };
}
