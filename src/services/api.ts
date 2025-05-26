
import { APP_CONFIG } from '@/lib/config';
import { ApiResponse } from '@/types/api';

class ApiService {
  private baseUrl: string;
  private currentUserId: string | null = null;

  constructor() {
    this.baseUrl = APP_CONFIG.api.baseUrl;
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.currentUserId) {
      headers['X-User-ID'] = this.currentUserId;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Users
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/users.php');
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/users.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Documents
  async getDocuments(): Promise<ApiResponse<any[]>> {
    return this.request('/documents.php');
  }

  async createDocument(document: any): Promise<ApiResponse<any>> {
    return this.request('/documents.php', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async updateDocument(document: any): Promise<ApiResponse<any>> {
    return this.request('/documents.php', {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  }

  async deleteDocument(id: string): Promise<ApiResponse<any>> {
    return this.request(`/documents.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Exigences
  async getExigences(): Promise<ApiResponse<any[]>> {
    return this.request('/exigences.php');
  }

  async createExigence(exigence: any): Promise<ApiResponse<any>> {
    return this.request('/exigences.php', {
      method: 'POST',
      body: JSON.stringify(exigence),
    });
  }

  async updateExigence(exigence: any): Promise<ApiResponse<any>> {
    return this.request('/exigences.php', {
      method: 'PUT',
      body: JSON.stringify(exigence),
    });
  }

  async deleteExigence(id: string): Promise<ApiResponse<any>> {
    return this.request(`/exigences.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Status
  async getStatus(): Promise<ApiResponse<any>> {
    return this.request('/status.php');
  }
}

export const apiService = new ApiService();
