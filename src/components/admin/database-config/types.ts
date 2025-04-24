
export interface DatabaseConfigType {
  host: string;
  db_name: string;
  username: string;
  password: string;
  available_databases?: string[];
}

export interface TestResult {
  success: boolean;
  message: string;
}
