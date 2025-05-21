
import { toast } from '@/components/ui/use-toast';
import { Exigence } from '@/types/exigences';
import { validateUserId } from '@/services/core/apiInterceptor';
import { getApiUrl } from '@/config/apiConfig';

// Sauvegarde locale des exigences
export const saveLocalExigences = (exigences: Exigence[], userId: string): void => {
  if (!userId) {
    console.error('ID utilisateur manquant pour sauvegarder les exigences');
    return;
  }
  
  try {
    const storageKey = `exigences_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(exigences));
    localStorage.setItem(`${storageKey}_last_modified`, Date.now().toString());
    console.log(`${exigences.length} exigences sauvegardées localement (utilisateur: ${userId})`);
  } catch (e) {
    console.error('Erreur lors de la sauvegarde locale des exigences:', e);
  }
};

// Récupération locale des exigences
export const getLocalExigences = (userId: string): Exigence[] => {
  if (!userId) {
    console.error('ID utilisateur manquant pour récupérer les exigences');
    return [];
  }
  
  try {
    const storageKey = `exigences_${userId}`;
    const exigencesJson = localStorage.getItem(storageKey);
    if (!exigencesJson) {
      return [];
    }
    const exigences = JSON.parse(exigencesJson) as Exigence[];
    console.log(`${exigences.length} exigences récupérées localement (utilisateur: ${userId})`);
    return exigences;
  } catch (e) {
    console.error('Erreur lors de la récupération locale des exigences:', e);
    return [];
  }
};

// Synchronisation des exigences avec le serveur
export const syncExigencesWithServer = async (exigences: Exigence[], userId: string): Promise<boolean> => {
  if (!exigences || exigences.length === 0) {
    console.log('Aucune exigence à synchroniser');
    return true;
  }
  
  // Vérifier l'ID utilisateur
  if (!userId) {
    const error = new Error('ID utilisateur requis pour la synchronisation');
    console.error(error);
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error.message
    });
    return false;
  }
  
  console.log(`Synchronisation de ${exigences.length} exigences pour l'utilisateur ${userId}...`);
  
  try {
    // Normaliser les données des exigences pour la synchronisation
    const normalizedExigences = exigences.map(exigence => ({
      id: exigence.id,
      nom: exigence.nom || '',
      responsabilites: exigence.responsabilites || null,
      exclusion: exigence.exclusion || false,
      atteinte: exigence.atteinte || null,
      groupId: exigence.groupId || null
    }));
    
    // Préparer les données pour la synchronisation
    const syncData = {
      userId,
      exigences: normalizedExigences,
      timestamp: new Date().toISOString()
    };
    
    const apiUrl = getApiUrl();
    const syncUrl = `${apiUrl}/exigences-sync.php`;
    
    console.log(`Envoi de la requête de synchronisation à ${syncUrl}`);
    
    // Appliquer un délai court pour éviter les problèmes de synchronisation rapide
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(syncData),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Échec de la synchronisation');
    }
    
    console.log(`Synchronisation réussie de ${result.count} exigences`);
    
    // Mettre à jour la date de dernière synchronisation
    const storageKey = `exigences_${userId}`;
    localStorage.setItem(`${storageKey}_last_synced`, Date.now().toString());
    
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

// Chargement des exigences depuis le serveur
export const loadExigencesFromServer = async (userId: string): Promise<Exigence[]> => {
  if (!userId) {
    console.error('ID utilisateur manquant pour charger les exigences du serveur');
    return [];
  }
  
  console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur...`);
  
  try {
    const apiUrl = getApiUrl();
    const loadUrl = `${apiUrl}/exigences-sync.php?userId=${encodeURIComponent(userId)}`;
    
    console.log(`Envoi de la requête GET à ${loadUrl}`);
    
    const response = await fetch(loadUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Échec du chargement des exigences');
    }
    
    // Sauvegarder les exigences en local
    const exigences = data.exigences || [];
    saveLocalExigences(exigences, userId);
    
    // Mettre à jour la date de dernière synchronisation
    const storageKey = `exigences_${userId}`;
    localStorage.setItem(`${storageKey}_last_synced`, Date.now().toString());
    
    console.log(`${exigences.length} exigences récupérées du serveur`);
    return exigences;
  } catch (error) {
    console.error('Erreur lors du chargement des exigences depuis le serveur:', error);
    
    toast({
      variant: 'default',
      title: 'Erreur de chargement',
      description: 'Utilisation des données locales suite à une erreur réseau'
    });
    
    // En cas d'erreur, récupérer les données locales
    return getLocalExigences(userId);
  }
};

// Obtenir la date de dernière synchronisation des exigences
export const getLastSyncedExigences = (userId: string): Date | null => {
  if (!userId) return null;
  
  try {
    const storageKey = `exigences_${userId}`;
    const lastSyncedStr = localStorage.getItem(`${storageKey}_last_synced`);
    return lastSyncedStr ? new Date(parseInt(lastSyncedStr, 10)) : null;
  } catch (e) {
    console.error('Erreur lors de la récupération de la date de dernière synchronisation:', e);
    return null;
  }
};

// Vérifier si des modifications sont en attente de synchronisation
export const hasPendingExigencesChanges = (userId: string): boolean => {
  if (!userId) return false;
  
  try {
    const storageKey = `exigences_${userId}`;
    const lastModifiedStr = localStorage.getItem(`${storageKey}_last_modified`);
    const lastSyncedStr = localStorage.getItem(`${storageKey}_last_synced`);
    
    if (!lastModifiedStr) return false;
    if (!lastSyncedStr) return true;
    
    const lastModified = parseInt(lastModifiedStr, 10);
    const lastSynced = parseInt(lastSyncedStr, 10);
    
    return lastModified > lastSynced;
  } catch (e) {
    console.error('Erreur lors de la vérification des modifications en attente:', e);
    return false;
  }
};
