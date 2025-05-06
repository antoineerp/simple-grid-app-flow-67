
export interface ApiConfig {
  api_urls: {
    development: string;
    production: string;
  };
  allowed_origins: {
    development: string;
    production: string;
  };
}

export interface JsonTestResult {
  success: boolean;
  response?: any;
  error?: Error | string | unknown;
  message?: string;
  details?: {
    tip?: string;
    error_code?: string;
    server_info?: string;
  };
}

export interface ApiStatus {
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
}
