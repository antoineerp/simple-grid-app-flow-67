
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Charge les exigences depuis le serveur et met à jour le stockage local
 */
export const loadExigencesFromServer = async (): Promise<Exigence[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Chargement des exigences depuis le serveur pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${API_URL}/exigences-load.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des exigences: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors du chargement des exigences');
    }
    
    // Mise à jour du stockage local
    saveExigencesToStorage(result.exigences || []);
    
    return result.exigences || [];
  } catch (error) {
    console.error('Erreur lors du chargement des exigences depuis le serveur:', error);
    
    // En cas d'erreur, essayer de récupérer depuis le stockage local
    const exigences = loadExigencesFromStorage();
    return exigences;
  }
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (exigences: Exigence[]): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Synchronisation de ${exigences.length} exigences pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        exigences
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la synchronisation des exigences: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors de la synchronisation des exigences');
    }
    
    toast({
      title: 'Synchronisation réussie',
      description: `${exigences.length} exigences synchronisées avec le serveur.`
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des exigences:', error);
    
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    return false;
  }
};

/**
 * Charge les exigences depuis le stockage local
 */
export const loadExigencesFromStorage = (): Exigence[] => {
  try {
    const userId = getCurrentUser();
    const storedExigences = localStorage.getItem(`exigences_${userId}`);
    
    if (storedExigences) {
      return JSON.parse(storedExigences);
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des exigences depuis le stockage local:', error);
    return [];
  }
};

/**
 * Sauvegarde les exigences dans le stockage local
 */
export const saveExigencesToStorage = (exigences: Exigence[]): void => {
  try {
    const userId = getCurrentUser();
    localStorage.setItem(`exigences_${userId}`, JSON.stringify(exigences));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des exigences dans le stockage local:', error);
  }
};
