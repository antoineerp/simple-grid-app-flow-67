
import { ApiResponse } from '@/types/api';
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { Document } from '@/types';

// Service API simplifié avec données mockées
class ApiService {
  private mockExigences: Exigence[] = [
    {
      id: '1',
      nom: 'Nouvelle exigence 1',
      description: 'Description de l\'exigence',
      exclusion: false,
      atteinte: 'non_conforme',
      ordre: 1
    }
  ];

  private mockDocuments: Document[] = [
    { id: '1', nom: 'Documents organisationnels', groupId: 'group1' },
    { id: '2', nom: 'Documents techniques', groupId: 'group2' },
    { id: '3', nom: 'Document de référence' },
    { id: '4', nom: 'Document technique' },
    { id: '5', nom: 'N.GCV' }
  ];

  async getExigences(): Promise<ApiResponse<Exigence[]>> {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: this.mockExigences,
      message: 'Exigences récupérées avec succès'
    };
  }

  async createExigence(exigence: Omit<Exigence, 'id'>): Promise<ApiResponse<Exigence>> {
    const newExigence: Exigence = {
      ...exigence,
      id: Date.now().toString(),
      date_creation: new Date()
    };
    
    this.mockExigences.push(newExigence);
    
    return {
      success: true,
      data: newExigence,
      message: 'Exigence créée avec succès'
    };
  }

  async updateExigence(exigence: Exigence): Promise<ApiResponse<Exigence>> {
    const index = this.mockExigences.findIndex(e => e.id === exigence.id);
    if (index !== -1) {
      this.mockExigences[index] = { ...exigence, date_modification: new Date() };
      return {
        success: true,
        data: this.mockExigences[index],
        message: 'Exigence mise à jour avec succès'
      };
    }
    
    return {
      success: false,
      message: 'Exigence non trouvée'
    };
  }

  async deleteExigence(id: string): Promise<ApiResponse<void>> {
    const index = this.mockExigences.findIndex(e => e.id === id);
    if (index !== -1) {
      this.mockExigences.splice(index, 1);
      return {
        success: true,
        message: 'Exigence supprimée avec succès'
      };
    }
    
    return {
      success: false,
      message: 'Exigence non trouvée'
    };
  }

  async getDocuments(): Promise<ApiResponse<Document[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      data: this.mockDocuments,
      message: 'Documents récupérés avec succès'
    };
  }

  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    // Simulation de connexion
    if (username && password) {
      return {
        success: true,
        data: {
          token: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            nom: 'Utilisateur',
            prenom: 'Test',
            email: username,
            identifiant_technique: 'test_user',
            role: 'admin'
          }
        },
        message: 'Connexion réussie'
      };
    }
    
    return {
      success: false,
      message: 'Identifiants invalides'
    };
  }
}

export const apiService = new ApiService();
