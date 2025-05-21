
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { 
  saveLocalData, 
  loadLocalData, 
  syncWithServer,
  getLastSynced
} from '@/services/sync/AutoSyncService';
import { toast } from '@/components/ui/use-toast';

// Nom du service pour le logging
const SERVICE_NAME = 'exigencesService';
const TABLE_NAME = 'exigences';

/**
 * Charge les exigences depuis le serveur et met à jour le stockage local
 */
export const loadExigencesFromServer = async (forceRefresh: boolean = false): Promise<Exigence[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`${SERVICE_NAME}: Chargement des exigences depuis le serveur pour ${userId}`);
    
    const response = await fetch(`${API_URL}/exigences-sync.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'User-Agent': 'FormaCert-App/1.0 (Chargement; QualiAPI)'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Échec du chargement des exigences');
    }
    
    const exigences = data.exigences || [];
    
    // Mise à jour du stockage local avec AutoSyncService
    saveLocalData(TABLE_NAME, exigences, userId);
    
    console.log(`${exigences.length} exigences récupérées du serveur`);
    return exigences;
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors du chargement depuis le serveur:`, error);
    if (!forceRefresh) {
      // En cas d'erreur, essayer de charger depuis le stockage local
      return loadExigencesFromStorage();
    }
    return [];
  }
};

/**
 * Synchronise les exigences avec le serveur en utilisant AutoSyncService
 */
export const syncExigencesWithServer = async (exigences: Exigence[]): Promise<boolean> => {
  if (!exigences || exigences.length === 0) {
    console.log('Aucune exigence à synchroniser');
    return true; // Considéré comme un succès car il n'y a rien à faire
  }
  
  console.log(`Début de la synchronisation de ${exigences.length} exigences...`);
  const userId = getCurrentUser();
  
  try {
    // Normaliser les exigences pour la synchronisation
    const normalizedExigences = exigences.map(exig => ({
      id: exig.id,
      nom: exig.nom || 'Sans titre',
      responsabilites: exig.responsabilites || { r: [], a: [], c: [], i: [] },
      exclusion: exig.exclusion || false,
      atteinte: exig.atteinte || null,
      groupId: exig.groupId || null,
      date_creation: exig.date_creation || new Date()
    }));
    
    // Utiliser AutoSyncService pour synchroniser
    const success = await syncWithServer(TABLE_NAME, normalizedExigences, userId);
    
    if (success) {
      console.log(`Synchronisation réussie de ${normalizedExigences.length} exigences`);
    } else {
      console.error(`Échec de la synchronisation des exigences`);
    }
    
    return success;
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors de la synchronisation:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de synchronisation",
      description: "Impossible de synchroniser les exigences avec le serveur.",
    });
    return false;
  }
};

/**
 * Charge les exigences depuis le stockage local en utilisant AutoSyncService
 */
export const loadExigencesFromStorage = (): Exigence[] => {
  try {
    const userId = getCurrentUser();
    const storedExigences = loadLocalData<Exigence>(TABLE_NAME, userId);
    console.log(`${storedExigences.length} exigences récupérées depuis le stockage local`);
    return storedExigences;
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors du chargement des données locales:`, error);
    return [];
  }
};

/**
 * Sauvegarde les exigences dans le stockage local en utilisant AutoSyncService
 */
export const saveExigencesToStorage = (exigences: Exigence[]): void => {
  try {
    const userId = getCurrentUser();
    saveLocalData(TABLE_NAME, exigences, userId);
    console.log(`${exigences.length} exigences sauvegardées en local`);
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors de la sauvegarde des données locales:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de stockage",
      description: "Impossible de sauvegarder les données localement. Vérifiez l'espace disponible."
    });
  }
};

/**
 * Force une synchronisation complète de toutes les exigences
 * en utilisant le service AutoSyncService
 */
export const forceFullSyncExigences = async (): Promise<boolean> => {
  console.log('Forçage de la synchronisation complète des exigences...');
  
  try {
    // Récupérer toutes les exigences locales
    const exigences = loadExigencesFromStorage();
    
    if (!exigences || exigences.length === 0) {
      console.log('Aucune exigence à synchroniser');
      toast({
        title: 'Aucune donnée à synchroniser',
        description: 'Aucune exigence trouvée localement pour la synchronisation.'
      });
      return true;
    }
    
    // Synchroniser les exigences avec le serveur
    const success = await syncExigencesWithServer(exigences);
    
    if (success) {
      toast({
        title: 'Synchronisation réussie',
        description: `${exigences.length} exigences ont été synchronisées avec le serveur.`
      });
      return true;
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la synchronisation',
        description: 'Impossible de synchroniser les exigences avec le serveur.'
      });
      return false;
    }
  } catch (error) {
    console.error('Erreur lors du forçage de la synchronisation:', error);
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return false;
  }
};

/**
 * Charge les exigences (en priorité depuis le serveur, sinon depuis le stockage local)
 */
export const loadExigences = async (forceRefresh: boolean = false): Promise<Exigence[]> => {
  try {
    // Essayer de charger depuis le serveur d'abord
    return await loadExigencesFromServer(forceRefresh);
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors du chargement depuis le serveur:`, error);
    
    // Fallback sur les données locales
    const localExigences = loadExigencesFromStorage();
    console.log(`${localExigences.length} exigences récupérées depuis le stockage local (fallback)`);
    
    return localExigences;
  }
};

/**
 * Obtient la date de dernière synchronisation des exigences
 */
export const getLastSyncedExigences = (): Date | null => {
  return getLastSynced(TABLE_NAME);
};
