export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

export interface JsonTestResult {
  success: boolean;
  response?: string;
  error?: any;
  warning?: string;
  recommendation?: string;
}
