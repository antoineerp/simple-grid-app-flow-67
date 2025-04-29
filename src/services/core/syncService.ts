
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Extrait un identifiant utilisateur valide pour les requêtes
 */
export const extractValidUserId = (userId: any): string => {
  // Si l'entrée est undefined ou null
  if (userId === undefined || userId === null) {
    console.log("userId invalide (null/undefined), utilisation de l'ID par défaut");
    return 'p71x6d_system';
  }
  
  // Si c'est déjà une chaîne, la retourner directement
  if (typeof userId === 'string') {
    // Vérifier si la chaîne est [object Object]
    if (userId === '[object Object]' || userId.includes('object')) {
      console.log("userId est la chaîne '[object Object]', utilisation de l'ID par défaut");
      return 'p71x6d_system';
    }
    return userId;
  }
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof userId === 'object') {
    // Propriétés potentielles pour extraire un ID
    const idProperties = ['identifiant_technique', 'email', 'id'];
    
    for (const prop of idProperties) {
      if (userId[prop] && typeof userId[prop] === 'string' && userId[prop].length > 0) {
        console.log(`ID utilisateur extrait de l'objet: ${prop}=${userId[prop]}`);
        return userId[prop];
      }
    }
    
    // Si toString() renvoie quelque chose d'autre que [object Object], l'utiliser
    const userIdString = String(userId);
    if (userIdString !== '[object Object]' && userIdString !== 'null' && userIdString !== 'undefined') {
      console.log(`Conversion de l'objet en chaîne: ${userIdString}`);
      return userIdString;
    }
  }
  
  console.log(`Utilisation de l'ID par défaut: p71x6d_system`);
  return 'p71x6d_system'; // Valeur par défaut si rien n'est valide
};

/**
 * Type générique pour les options de synchronisation
 */
export interface SyncOptions<T> {
  endpoint: string; // endpoint à appeler (ex: "documents-sync.php")
  loadEndpoint: string; // endpoint pour charger les données (ex: "documents-load.php")
  data?: T[]; // données à synchroniser (optionnel pour loadFromServer)
  userId: any; // ID utilisateur
  dataName?: string; // nom de la propriété dans le corps de la requête (ex: "documents", "membres")
  additionalData?: Record<string, any>; // données supplémentaires à envoyer
  maxRetries?: number; // nombre maximal de tentatives (défaut: 3)
  retryDelay?: number; // délai entre les tentatives en ms (défaut: 1000)
}

/**
 * Hook personnalisé pour gérer la synchronisation avec le serveur
 */
export const useSyncService = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  /**
   * Fonction utilitaire pour attendre un délai avec une valeur aléatoire
   */
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));
  
  /**
   * Fonction générique pour synchroniser les données avec le serveur
   */
  const syncWithServer = async <T extends any>(options: SyncOptions<T>): Promise<boolean> => {
    if (!isOnline || isSyncing) return false;
    
    // Si trop d'échecs consécutifs, bloquer la synchronisation
    if (syncFailed && syncAttempts >= 3) {
      console.error("Synchronisation bloquée après plusieurs échecs consécutifs");
      toast({
        title: "Synchronisation bloquée",
        description: "Veuillez réinitialiser la synchronisation ou réessayer plus tard.",
        variant: "destructive"
      });
      return false;
    }
    
    const { 
      endpoint, 
      data = [], 
      userId, 
      dataName = getDataNameFromEndpoint(endpoint), 
      additionalData = {},
      maxRetries = 3
    } = options;
    
    const safeUserId = extractValidUserId(userId);
    
    setIsSyncing(true);
    try {
      console.log(`Synchronisation de ${data.length} éléments pour l'utilisateur ${safeUserId} via ${endpoint}`);
      
      // Tentatives avec backoff exponentiel
      let attempt = 0;
      let success = false;
      let lastError: any = null;
      
      while (attempt < maxRetries && !success) {
        try {
          if (attempt > 0) {
            // Attendre avec un délai exponentiel (1s, 2s, 4s...)
            await delay(Math.pow(2, attempt - 1) * 1000);
            console.log(`Tentative ${attempt + 1}/${maxRetries} pour ${endpoint}`);
          }
          
          const response = await fetch(`${getApiUrl()}/${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              userId: safeUserId,
              [dataName]: data,
              ...additionalData
            }),
            // Augmenter le timeout pour les requêtes
            signal: AbortSignal.timeout(30000) // 30 secondes
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur serveur (${response.status}) lors de la synchronisation:`, errorText);
            throw new Error(`Erreur serveur: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            success = true;
          } else {
            throw new Error(result.message || "Échec de synchronisation");
          }
        } catch (error) {
          lastError = error;
          attempt++;
          
          if (attempt >= maxRetries) {
            throw error;
          }
        }
      }
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        setSyncAttempts(0);
        console.log(`Synchronisation réussie via ${endpoint}`);
        
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur",
          variant: "default"
        });
        
        return true;
      } else {
        // Ne devrait jamais arriver car on aurait lancé une exception avant
        throw lastError || new Error("Échec de synchronisation après plusieurs tentatives");
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Fonction générique pour charger des données depuis le serveur
   */
  const loadFromServer = async <T>(options: SyncOptions<T>): Promise<T[] | null> => {
    const { 
      endpoint, 
      loadEndpoint, 
      userId,
      maxRetries = 3,
      retryDelay = 1000
    } = options;
    
    const safeUserId = extractValidUserId(userId);
    
    setIsSyncing(true);
    
    try {
      console.log(`Chargement des données pour l'utilisateur ${safeUserId} via ${loadEndpoint}`);
      
      // Tentatives avec backoff exponentiel
      let attempt = 0;
      let lastError: any = null;
      
      while (attempt < maxRetries) {
        try {
          if (attempt > 0) {
            // Attendre avec un délai exponentiel entre les tentatives
            await delay(Math.pow(2, attempt - 1) * retryDelay);
            console.log(`Tentative ${attempt + 1}/${maxRetries} pour ${loadEndpoint}`);
          }
          
          const encodedUserId = encodeURIComponent(safeUserId);
          const url = `${getApiUrl()}/${loadEndpoint}?userId=${encodedUserId}`;
          const urlWithTimestamp = `${url}&_t=${new Date().getTime()}`; // Anti-cache
          
          const response = await fetch(urlWithTimestamp, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-store',
            // Augmenter le timeout pour les requêtes
            signal: AbortSignal.timeout(30000) // 30 secondes
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur serveur (${response.status}) lors du chargement:`, errorText);
            throw new Error(`Erreur serveur: ${response.status}`);
          }
          
          const responseText = await response.text();
          
          // Vérifier si la réponse est vide
          if (!responseText || !responseText.trim()) {
            console.warn("Réponse vide du serveur");
            return [];
          }
          
          try {
            const result = JSON.parse(responseText);
            
            // Déterminer le nom de la propriété contenant les données en fonction de l'endpoint
            const dataName = getDataNameFromEndpoint(loadEndpoint);
            const data = result[dataName] || result;
            
            setLastSynced(new Date());
            setSyncFailed(false);
            setSyncAttempts(0);
            setLoadError(null);
            
            if (Array.isArray(data)) {
              return data as T[];
            } else {
              console.warn(`Format de données inattendu pour ${loadEndpoint}:`, data);
              return [];
            }
          } catch (jsonError) {
            console.error("Erreur lors du parsing JSON:", jsonError, "Texte brut:", responseText);
            throw new Error("Format de réponse invalide");
          }
        } catch (error) {
          lastError = error;
          attempt++;
          
          if (attempt >= maxRetries) {
            throw error;
          }
        }
      }
      
      // Normalement on ne devrait jamais arriver ici grâce au throw dans la boucle
      throw lastError || new Error("Échec après plusieurs tentatives");
      
    } catch (error) {
      console.error(`Erreur lors du chargement via ${loadEndpoint}:`, error);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
      
      // N'afficher le toast que si c'est la dernière tentative
      if (syncAttempts >= maxRetries! - 1) {
        toast({
          title: "Erreur de chargement",
          description: error instanceof Error ? error.message : "Une erreur s'est produite",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Détermine le nom de la propriété pour les données à partir de l'endpoint
   */
  const getDataNameFromEndpoint = (endpoint: string): string => {
    if (endpoint.includes('document')) return 'documents';
    if (endpoint.includes('membre')) return 'membres';
    if (endpoint.includes('exigence')) return 'exigences';
    if (endpoint.includes('bibliotheque')) return 'ressources';
    
    // Extraire le nom de la base
    const baseName = endpoint.split('-')[0];
    return baseName || 'data';
  };
  
  /**
   * Réinitialise l'état de synchronisation
   */
  const resetSyncStatus = () => {
    setSyncFailed(false);
    setSyncAttempts(0);
    setLoadError(null);
  };
  
  return {
    syncWithServer,
    loadFromServer,
    resetSyncStatus,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    loadError,
    syncAttempts
  };
};

/**
 * Méthode simplifiée pour la synchronisation de toutes les données en une seule fois
 * Note: Cette fonction est expérimentale et nécessite une implémentation côté serveur
 */
export const syncAllData = async (options: {
  documents?: any[],
  membres?: any[],
  exigences?: any[],
  bibliotheque?: any[],
  userId: any
}): Promise<boolean> => {
  try {
    const { userId, ...data } = options;
    const safeUserId = extractValidUserId(userId);
    
    console.log(`Synchronisation globale pour l'utilisateur ${safeUserId}`);
    
    const response = await fetch(`${getApiUrl()}/sync-all.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId: safeUserId,
        data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Erreur lors de la synchronisation globale:", error);
    return false;
  }
};
