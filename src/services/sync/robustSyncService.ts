
/**
 * Service de synchronisation robuste avec gestion des erreurs avancée
 */

import { validateJsonResponse } from '@/utils/jsonValidator';
import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/auth/authService';

interface SyncOptions {
  retryCount?: number;
  validate?: boolean;
  silent?: boolean;
  timeout?: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// Vérifier si l'API JSON est fonctionnelle
export const verifyJsonEndpoint = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiUrl()}/verify-json-endpoint.php?nocache=${Date.now()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`verifyJsonEndpoint: Erreur HTTP ${response.status}`);
      return false;
    }
    
    const text = await response.text();
    const { isValid, data } = validateJsonResponse(text);
    
    if (!isValid) {
      console.error('verifyJsonEndpoint: Réponse non-JSON', text.substring(0, 100));
      return false;
    }
    
    return data && data.success === true;
  } catch (error) {
    console.error('verifyJsonEndpoint: Erreur de connexion', error);
    return false;
  }
};

// Service principal de synchronisation robuste
export const robustSync = {
  /**
   * Synchronise les données avec le serveur
   */
  syncData: async <T>(
    tableName: string, 
    records: T[], 
    options: SyncOptions = {}
  ): Promise<SyncResult> => {
    const {
      retryCount = 2,
      validate = true,
      silent = false,
      timeout = 15000
    } = options;
    
    // Récupérer l'ID utilisateur actuel
    const userId = getCurrentUser();
    if (!userId) {
      console.error('Synchronisation impossible: utilisateur non connecté');
      if (!silent) {
        toast({
          title: 'Erreur de synchronisation',
          description: 'Vous devez être connecté pour synchroniser vos données',
          variant: 'destructive'
        });
      }
      return {
        success: false,
        message: 'Utilisateur non connecté'
      };
    }
    
    // Vérifier que les enregistrements sont valides
    if (!Array.isArray(records)) {
      console.error(`syncData: records doit être un tableau (reçu: ${typeof records})`);
      return {
        success: false,
        message: 'Format de données invalide'
      };
    }
    
    // Validation préalable de l'endpoint JSON si demandé
    if (validate) {
      const endpointValid = await verifyJsonEndpoint();
      if (!endpointValid) {
        console.error('syncData: Le point de terminaison JSON n\'est pas valide');
        if (!silent) {
          toast({
            title: 'Erreur de communication',
            description: 'Impossible de communiquer correctement avec le serveur',
            variant: 'destructive'
          });
        }
        return {
          success: false,
          message: 'Point de terminaison JSON non valide'
        };
      }
    }
    
    let lastError = null;
    
    // Boucle de tentatives avec backoff exponentiel
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      if (attempt > 0) {
        // Attente exponentielle entre les tentatives
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`syncData: Tentative ${attempt}/${retryCount} après ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      try {
        // Créer un AbortController pour gérer le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(`${getApiUrl()}/robust-sync.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({
            userId,
            tableName,
            records,
            timestamp: Date.now()
          }),
          signal: controller.signal
        });
        
        // Nettoyer le timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        const { isValid, data, error } = validateJsonResponse(text);
        
        if (!isValid) {
          throw new Error(`Réponse non-JSON: ${error}`);
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Échec de la synchronisation');
        }
        
        // Synchronisation réussie
        console.log(`syncData: Synchronisation réussie pour ${tableName}`);
        
        // Notifier l'utilisateur si nécessaire
        if (!silent) {
          toast({
            title: 'Synchronisation réussie',
            description: `${records.length} enregistrements synchronisés`
          });
        }
        
        return {
          success: true,
          message: 'Synchronisation réussie',
          data
        };
        
      } catch (error) {
        lastError = error;
        console.error(`syncData: Erreur tentative ${attempt}/${retryCount}`, error);
        
        // Si c'est une erreur d'abandon (timeout), message spécifique
        if (error.name === 'AbortError') {
          console.error(`syncData: Timeout après ${timeout}ms`);
        }
        
        // Si c'est la dernière tentative, notifier l'utilisateur
        if (attempt === retryCount && !silent) {
          toast({
            title: 'Échec de synchronisation',
            description: error instanceof Error ? error.message : 'Erreur inconnue',
            variant: 'destructive'
          });
        }
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    return {
      success: false,
      message: lastError instanceof Error ? lastError.message : 'Erreurs multiples de synchronisation'
    };
  },
  
  /**
   * Charge les données depuis le serveur
   */
  loadData: async <T>(
    tableName: string,
    options: SyncOptions = {}
  ): Promise<T[] | null> => {
    // À implémenter selon les mêmes principes que syncData
    // Pour l'instant, le chargement n'est pas implémenté
    console.warn('loadData: Non implémenté');
    return null;
  }
};

export default robustSync;
