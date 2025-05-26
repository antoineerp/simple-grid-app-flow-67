
import { APP_CONFIG } from '@/lib/config';
import { ApiResponse } from '@/types/api';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = APP_CONFIG.api.baseUrl;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem(APP_CONFIG.auth.tokenKey);
    const userId = this.getCurrentUserId();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['X-User-ID'] = userId;
    }

    return headers;
  }

  private getCurrentUserId(): string | null {
    const userStr = localStorage.getItem(APP_CONFIG.auth.userKey);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return user.identifiant_technique;
    } catch {
      return null;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return response.json();
  }
}

export const apiClient = new ApiClient();
