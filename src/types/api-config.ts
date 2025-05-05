
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
  warning?: string;
}
