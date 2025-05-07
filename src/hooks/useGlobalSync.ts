
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

export interface AppData {
  documents?: any[];
  exigences?: any[];
  membres?: any[];
  pilotageDocuments?: any[];
  bibliotheque?: {
    documents: any[];
    groups: any[];
  };
  lastModified?: number;
}

export const useGlobalSync = () => {
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [appData, setAppData] = useState<AppData>({});

  // Récupérer l'identifiant technique de l'utilisateur connecté
  const getUserId = (): string => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return 'default';
    
    try {
      const currentUser = JSON.parse(currentUserStr);
      return currentUser.identifiant_technique || currentUser.id || 'default';
    } catch (e) {
      return currentUserStr;
    }
  };
  
  const userId = getUserId();

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
    
    // Écouter les mises à jour de données
    const handleDataUpdate = () => {
      setAppData(loadAllFromStorage(userId));
    };
    
    window.addEventListener('globalDataUpdate', handleDataUpdate);
    
    return () => {
      window.removeEventListener('globalDataUpdate', handleDataUpdate);
    };
  }, [userId]);

  // Fonction pour charger les données
  const loadData = async () => {
    if (isOnline) {
      try {
        setIsSyncing(true);
        const serverData = await loadAllFromServer(userId);
        if (serverData) {
          saveAllToStorage(userId, serverData);
          setAppData(serverData);
          setLastSynced(new Date());
          setIsSyncing(false);
          return;
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis le serveur:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    
    // Si hors ligne ou erreur de chargement, utiliser les données locales
    const localData = loadAllFromStorage(userId);
    setAppData(localData);
  };

  // Fonction pour sauvegarder les données actuelles
  const saveData = (newData: AppData) => {
    // Ajouter l'horodatage de modification
    const dataWithTimestamp = {
      ...newData,
      lastModified: Date.now()
    };
    
    saveAllToStorage(userId, dataWithTimestamp);
    setAppData(dataWithTimestamp);
  };

  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Synchronisation impossible",
        description: "Vous êtes actuellement hors ligne",
        variant: "destructive",
      });
      return false;
    }

    setIsSyncing(true);
    
    try {
      // Récupérer les données les plus récentes du localStorage
      const currentData = loadAllFromStorage(userId);
      
      // Envoyer directement les données au serveur
      const success = await sendDataToServer(userId, currentData);
      
      if (success) {
        const now = new Date();
        setLastSynced(now);
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les données ont été synchronisées avec le serveur",
        });
        return true;
      } else {
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser avec le serveur",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: `${error}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Fonction simplifiée pour envoyer les données au serveur
  const sendDataToServer = async (userId: string, data: AppData): Promise<boolean> => {
    const API_URL = getApiUrl();
    
    try {
      const response = await fetch(`${API_URL}/global-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          data: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error("Erreur lors de l'envoi des données:", error);
      throw error;
    }
  };
  
  // Vérifier si des modifications sont en attente de synchronisation
  const hasUnsyncedData = (): boolean => {
    if (!lastSynced) return true;
    
    const lastSyncedTime = lastSynced.getTime();
    const lastModified = appData.lastModified || 0;
    
    return lastModified > lastSyncedTime;
  };

  return {
    appData,
    saveData,
    syncWithServer,
    loadData,
    isSyncing,
    isOnline,
    lastSynced,
    hasUnsyncedData: hasUnsyncedData()
  };
};

// Fonctions utilitaires déplacées ici pour simplifier

const normalizeUserId = (userId: any): string => {
  if (!userId) return 'default';
  
  if (typeof userId === 'string') {
    try {
      const userObj = JSON.parse(userId);
      return userObj.identifiant_technique || userObj.id?.toString() || 'default';
    } catch (e) {
      return userId;
    }
  } else if (typeof userId === 'object') {
    return userId.identifiant_technique || userId.id?.toString() || 'default';
  }
  
  return String(userId);
};

export const loadAllFromServer = async (userId: any): Promise<AppData | null> => {
  try {
    const normalizedId = normalizeUserId(userId);
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/global-load.php?userId=${encodeURIComponent(normalizedId)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Échec du chargement global: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    const data = result.data || null;
    if (data) {
      data.lastModified = Date.now();
    }
    
    return data;
  } catch (error) {
    console.error('Erreur de chargement global:', error);
    return null;
  }
};

export const saveAllToStorage = (userId: any, data: AppData): void => {
  const normalizedId = normalizeUserId(userId);
  
  const timestamp = Date.now();
  const dataWithTimestamp = {
    ...data,
    lastModified: timestamp
  };
  
  if (dataWithTimestamp.documents) {
    localStorage.setItem(`documents_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.documents,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.exigences) {
    localStorage.setItem(`exigences_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.exigences,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.membres) {
    localStorage.setItem(`membres_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.membres,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.pilotageDocuments) {
    localStorage.setItem(`pilotage_${normalizedId}`, JSON.stringify({
      data: dataWithTimestamp.pilotageDocuments,
      lastModified: timestamp
    }));
  }
  
  if (dataWithTimestamp.bibliotheque) {
    const { documents, groups } = dataWithTimestamp.bibliotheque;
    localStorage.setItem(`bibliotheque_documents_${normalizedId}`, JSON.stringify({
      data: documents,
      lastModified: timestamp
    }));
    localStorage.setItem(`bibliotheque_groups_${normalizedId}`, JSON.stringify({
      data: groups,
      lastModified: timestamp
    }));
  }
  
  window.dispatchEvent(new Event('globalDataUpdate'));
};

export const loadAllFromStorage = (userId: any): AppData => {
  const normalizedId = normalizeUserId(userId);
  const data: AppData = {};
  let globalLastModified = 0;
  
  const documentsJson = localStorage.getItem(`documents_${normalizedId}`);
  if (documentsJson) {
    try {
      const parsed = JSON.parse(documentsJson);
      data.documents = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des documents:", e);
    }
  }
  
  const exigencesJson = localStorage.getItem(`exigences_${normalizedId}`);
  if (exigencesJson) {
    try {
      const parsed = JSON.parse(exigencesJson);
      data.exigences = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des exigences:", e);
    }
  }
  
  const membresJson = localStorage.getItem(`membres_${normalizedId}`);
  if (membresJson) {
    try {
      const parsed = JSON.parse(membresJson);
      data.membres = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des membres:", e);
    }
  }
  
  const pilotageJson = localStorage.getItem(`pilotage_${normalizedId}`);
  if (pilotageJson) {
    try {
      const parsed = JSON.parse(pilotageJson);
      data.pilotageDocuments = parsed.data || parsed;
      if (parsed.lastModified && parsed.lastModified > globalLastModified) {
        globalLastModified = parsed.lastModified;
      }
    } catch (e) {
      console.error("Erreur lors du parsing des documents de pilotage:", e);
    }
  }
  
  const bibliothequeDocumentsJson = localStorage.getItem(`bibliotheque_documents_${normalizedId}`);
  const bibliothequeGroupsJson = localStorage.getItem(`bibliotheque_groups_${normalizedId}`);
  
  if (bibliothequeDocumentsJson || bibliothequeGroupsJson) {
    data.bibliotheque = {
      documents: [],
      groups: []
    };
    
    if (bibliothequeDocumentsJson) {
      try {
        const parsed = JSON.parse(bibliothequeDocumentsJson);
        data.bibliotheque.documents = parsed.data || parsed;
        if (parsed.lastModified && parsed.lastModified > globalLastModified) {
          globalLastModified = parsed.lastModified;
        }
      } catch (e) {
        console.error("Erreur lors du parsing des documents bibliothèque:", e);
      }
    }
    
    if (bibliothequeGroupsJson) {
      try {
        const parsed = JSON.parse(bibliothequeGroupsJson);
        data.bibliotheque.groups = parsed.data || parsed;
        if (parsed.lastModified && parsed.lastModified > globalLastModified) {
          globalLastModified = parsed.lastModified;
        }
      } catch (e) {
        console.error("Erreur lors du parsing des groupes de bibliothèque:", e);
      }
    }
  }
  
  data.lastModified = globalLastModified || Date.now();
  
  return data;
};
