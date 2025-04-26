
export interface DiagnosticResult {
  timestamp: string;
  server_info: {
    php_version: string;
    server_name: string;
    script: string;
    remote_addr: string;
  };
  pdo_direct: {
    status: string;
    message: string;
    connection_info?: {
      host: string;
      database: string;
      user: string;
    };
    error?: string;
  };
  database_class: {
    status: string;
    message: string;
    config: {
      host: string;
      db_name: string;
      username: string;
      source: string;
    };
    error?: string;
  };
  config_file: {
    status: string;
    message: string;
    config?: {
      host: string;
      db_name: string;
      username: string;
    };
    error?: string;
  };
  config_consistency: {
    status: string;
    is_consistent: boolean;
    message: string;
    differences?: {
      host: string;
      database: string;
      username: string;
    };
  };
}
