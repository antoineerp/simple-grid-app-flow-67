
import { APP_CONFIG } from '@/lib/config';

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  async login(username: string, password: string) {
    return this.request('/auth.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users.php');
  }

  async createUser(userData: any) {
    return this.request('/users.php', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Documents
  async getDocuments() {
    return this.request('/documents.php');
  }

  async createDocument(document: any) {
    return this.request('/documents.php', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async updateDocument(document: any) {
    return this.request('/documents.php', {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Exigences
  async getExigences() {
    return this.request('/exigences.php');
  }

  async createExigence(exigence: any) {
    return this.request('/exigences.php', {
      method: 'POST',
      body: JSON.stringify(exigence),
    });
  }

  async updateExigence(exigence: any) {
    return this.request('/exigences.php', {
      method: 'PUT',
      body: JSON.stringify(exigence),
    });
  }

  async deleteExigence(id: string) {
    return this.request(`/exigences.php?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Status
  async getStatus() {
    return this.request('/status.php');
  }
}

export const apiService = new ApiService();
