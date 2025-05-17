
import { Membre } from '@/types/membres';
import { triggerSync } from '@/services/sync';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUserId, getDeviceId } from '@/services/core/userService';
import { toast } from '@/components/ui/use-toast';

// Cache local pour optimiser les performances
let membresCache: Membre[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Récupère les membres depuis l'API ou le cache si disponible
 */
export const getMembres = async (): Promise<Membre[]> => {
  // Utiliser le cache si disponible et récent
  if (membresCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    console.log("Utilisation du cache pour getMembres");
    return membresCache;
  }

  try {
    const userId = getCurrentUserId() || '999'; // Valeur par défaut si non défini
    const deviceId = getDeviceId() || 'unknown_device';
    const API_URL = getApiUrl() || window.location.origin + '/api';
    
    console.log(`Chargement des membres pour l'utilisateur: ${userId}`);
    
    const response = await fetch(`${API_URL}/membres-load.php?userId=${encodeURIComponent(userId)}&deviceId=${encodeURIComponent(deviceId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      // En cas d'erreur, retourner les données du cache ou des données locales par défaut
      console.error(`Erreur HTTP: ${response.status}`);
      return getLocalMembres();
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(data.message || "Erreur lors du chargement des membres");
      return getLocalMembres();
    }

    const membres = data.membres || [];
    
    // Mise à jour du cache
    membresCache = membres;
    lastFetchTime = Date.now();
    
    console.log(`${membres.length} membres chargés pour l'utilisateur ${userId}`);
    return membres;
  } catch (error) {
    console.error("Erreur lors du chargement des membres:", error);
    
    // Retourner le cache ou des données locales par défaut
    return getLocalMembres();
  }
};

/**
 * Récupère des données locales par défaut si aucune donnée n'est disponible
 */
const getLocalMembres = (): Membre[] => {
  // Retourner le cache même périmé si disponible
  if (membresCache) {
    console.log("Utilisation du cache périmé après échec");
    return membresCache;
  }
  
  // Si aucun cache disponible, retourner des données par défaut
  const defaultMembres: Membre[] = [
    {
      id: 'membre_default_1',
      nom: 'Dupont',
      prenom: 'Jean',
      fonction: 'Directeur',
      initiales: 'JD',
      email: 'jean.dupont@example.com',
      telephone: '+33 6 12 34 56 78',
      date_creation: new Date()
    },
    {
      id: 'membre_default_2',
      nom: 'Martin',
      prenom: 'Sophie',
      fonction: 'Responsable RH',
      initiales: 'SM',
      email: 'sophie.martin@example.com',
      telephone: '+33 6 23 45 67 89',
      date_creation: new Date()
    }
  ];
  
  // Stocker ces données dans le cache
  membresCache = defaultMembres;
  lastFetchTime = Date.now();
  
  return defaultMembres;
};

/**
 * Rafraîchit les membres depuis l'API en ignorant le cache
 */
export const refreshMembres = async (): Promise<Membre[]> => {
  // Réinitialiser le cache
  membresCache = null;
  lastFetchTime = 0;
  
  // Récupérer les données fraîches
  return getMembres();
};

/**
 * Obtient un membre spécifique par son ID
 */
export const getMembre = async (id: string): Promise<Membre | undefined> => {
  const membres = await getMembres();
  return membres.find(membre => membre.id === id);
};

/**
 * Crée un nouveau membre et le synchronise avec le serveur
 */
export const createMembre = async (membre: Omit<Membre, 'id'>): Promise<Membre> => {
  try {
    // Récupérer les membres actuels
    const membres = await getMembres();
    
    // Générer un ID unique
    const newId = `membre_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Créer le nouveau membre
    const newMembre: Membre = {
      ...membre,
      id: newId,
      date_creation: new Date(),
      // Assurer que le membre a des initiales
      initiales: membre.initiales || `${membre.prenom?.charAt(0) || ''}${membre.nom?.charAt(0) || ''}`.toUpperCase()
    };
    
    // Ajouter au cache local
    if (membresCache) {
      membresCache.push(newMembre);
    } else {
      membresCache = [newMembre];
      lastFetchTime = Date.now();
    }
    
    // Synchroniser avec le serveur
    try {
      await syncMembres();
    } catch (syncError) {
      console.warn("Erreur de synchronisation, mais le membre a été créé localement:", syncError);
    }
    
    return newMembre;
  } catch (error) {
    console.error("Erreur lors de la création d'un membre:", error);
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Impossible de créer le membre. Veuillez réessayer."
    });
    throw error;
  }
};

/**
 * Met à jour un membre existant
 */
export const updateMembre = async (id: string, membre: Partial<Membre>): Promise<Membre> => {
  try {
    // Récupérer les membres actuels
    const membres = await getMembres();
    const existingIndex = membres.findIndex(m => m.id === id);
    
    if (existingIndex === -1) {
      throw new Error(`Membre avec l'ID ${id} non trouvé`);
    }
    
    // Mettre à jour le membre
    const updatedMembre: Membre = {
      ...membres[existingIndex],
      ...membre,
      id, // Maintenir le même ID
      date_modification: new Date()
    };
    
    // Mettre à jour le cache local
    if (membresCache) {
      membresCache[existingIndex] = updatedMembre;
    }
    
    // Synchroniser avec le serveur
    try {
      await syncMembres();
    } catch (syncError) {
      console.warn("Erreur de synchronisation, mais le membre a été mis à jour localement:", syncError);
    }
    
    return updatedMembre;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un membre:", error);
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Impossible de mettre à jour le membre. Veuillez réessayer."
    });
    throw error;
  }
};

/**
 * Supprime un membre par son ID
 */
export const deleteMembre = async (id: string): Promise<boolean> => {
  try {
    // Mettre à jour le cache local
    if (membresCache) {
      membresCache = membresCache.filter(m => m.id !== id);
    }
    
    // Synchroniser avec le serveur
    try {
      await syncMembres();
    } catch (syncError) {
      console.warn("Erreur de synchronisation, mais le membre a été supprimé localement:", syncError);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression d'un membre:", error);
    toast({
      variant: "destructive",
      title: "Erreur",
      description: "Impossible de supprimer le membre. Veuillez réessayer."
    });
    throw error;
  }
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembres = async (): Promise<boolean> => {
  try {
    // Récupérer l'ID de l'utilisateur et de l'appareil
    const userId = getCurrentUserId() || '999';
    const deviceId = getDeviceId() || 'unknown_device';
    const API_URL = getApiUrl() || window.location.origin + '/api';
    
    if (!membresCache || membresCache.length === 0) {
      console.log("Aucune donnée à synchroniser");
      return false;
    }
    
    console.log(`Synchronisation de ${membresCache.length} membres pour l'utilisateur ${userId}`);
    
    // Préparer les données pour la synchronisation
    const syncData = {
      userId,
      deviceId,
      membres: membresCache
    };
    
    // Envoyer les données au serveur
    const response = await fetch(`${API_URL}/membres-sync.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(syncData)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Erreur lors de la synchronisation");
    }
    
    console.log("Synchronisation des membres réussie");
    return true;
  } catch (error) {
    // Ne pas faire échouer l'application si la synchronisation échoue
    console.error("Erreur lors de la synchronisation des membres:", error);
    return false;
  }
};
