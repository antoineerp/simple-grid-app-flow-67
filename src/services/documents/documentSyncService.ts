import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';
import { 
  saveLocalData, 
  loadLocalData, 
  markPendingSync, 
  clearPendingSync, 
  hasLocalData 
} from '@/features/sync/utils/syncStorageManager';

// Garde un suivi des requêtes récentes pour éviter les duplications
const recentRequests = new Map<string, number>();
const REQUEST_THROTTLE_MS = 5000; // 5 secondes entre les requêtes

/**
 * Chargement des documents depuis le serveur pour un utilisateur spécifique
 * Priorise toujours la base de données Infomaniak
 */
export const loadDocumentsFromServer = async (userId: string | null = null): Promise<Document[]> => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  const requestKey = `documents_load_${currentUser}`;
  
  // Vérifier si une requête similaire a été faite récemment
  const now = Date.now();
  const lastRequest = recentRequests.get(requestKey) || 0;
  
  if (now - lastRequest < REQUEST_THROTTLE_MS) {
    console.log(`Requête ignorée (throttle: ${now - lastRequest}ms) - Utilisation du cache local`);
    // Si oui, retourner les données du cache local pour éviter les requêtes multiples
    return getLocalDocuments(userId);
  }
  
  // Marquer cette requête comme la plus récente
  recentRequests.set(requestKey, now);
  
  // Essayer d'abord de récupérer depuis le stockage local (pour éviter les pertes de données)
  const localDocuments = getLocalDocuments(userId);
  
  // Tentative de chargement depuis le serveur seulement si en ligne
  if (navigator.onLine) {
    try {
      // Construire l'URL
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/documents-load.php`;
      
      // Utiliser GET avec l'userId en paramètre d'URL
      const response = await fetch(`${endpoint}?userId=${currentUser}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      let serverDocuments: Document[] = [];
      
      if (result.success && Array.isArray(result.documents)) {
        serverDocuments = result.documents;
      } else if (Array.isArray(result)) {
        serverDocuments = result;
      } else if (result.records && Array.isArray(result.records)) {
        serverDocuments = result.records;
      } else {
        throw new Error("Format de réponse non reconnu");
      }
      
      // Fusionner les documents locaux et ceux du serveur si nécessaire
      const mergedDocuments = serverDocuments.length > 0 
        ? mergeDocuments(localDocuments, serverDocuments) 
        : localDocuments;
      
      // Sauvegarder dans les deux systèmes de stockage pour accès hors ligne
      saveLocalData('documents', mergedDocuments, currentUser);
      
      return mergedDocuments;
    } catch (firstError) {
      console.warn("Première tentative de chargement échouée:", firstError);
      
      // Deuxième tentative - URL alternative
      try {
        const apiAltUrl = `/sites/qualiopi.ch/api`;
        
        const response = await fetch(`${apiAltUrl}/documents-load.php?userId=${currentUser}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP alternative ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        let serverDocuments: Document[] = [];
        
        if (result.success && Array.isArray(result.documents)) {
          serverDocuments = result.documents;
        } else if (Array.isArray(result)) {
          serverDocuments = result;
        } else if (result.records && Array.isArray(result.records)) {
          serverDocuments = result.records;
        } else {
          throw new Error("Format de réponse alternative non reconnu");
        }
        
        // Fusionner les documents locaux et ceux du serveur si nécessaire
        const mergedDocuments = serverDocuments.length > 0 
          ? mergeDocuments(localDocuments, serverDocuments) 
          : localDocuments;
        
        // Sauvegarder pour accès hors ligne
        saveLocalData('documents', mergedDocuments, currentUser);
        
        return mergedDocuments;
      } catch (secondError) {
        console.error("Toutes les tentatives de chargement depuis le serveur ont échoué:", secondError);
      }
    }
  }
  
  // Retourner les documents locaux si hors ligne ou en cas d'erreur
  return localDocuments;
};

/**
 * Synchronisation des documents avec le serveur
 * Priorise toujours la base de données Infomaniak
 */
export const syncDocumentsWithServer = async (documents: Document[], userId: string | null = null): Promise<boolean> => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  console.log(`Synchronisation des documents pour l'utilisateur ${currentUser} (priorité serveur)`);
  
  // Assurer que les documents ont un ID valide
  const validDocuments = documents.map(doc => ({
    ...doc,
    id: doc.id || crypto.randomUUID()
  }));
  
  // AMÉLIORATION: Sauvegarder localement IMMÉDIATEMENT pour éviter les pertes de données
  saveLocalData('documents', validDocuments, currentUser);
  console.log(`Documents sauvegardés localement en priorité pour éviter les pertes`);
  
  // Marquer comme en attente de synchronisation
  markPendingSync('documents');
  
  try {
    // Construire l'URL
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/documents-sync.php`;
    
    console.log(`Tentative de synchronisation vers: ${endpoint}`);
    
    // Première tentative - URL standard
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser,
        documents: validDocuments
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents:", result);
    
    if (result.success === true) {
      // Enregistrer la date de la dernière synchronisation réussie
      const timestamp = new Date().toISOString();
      localStorage.setItem(`last_synced_documents`, timestamp);
      sessionStorage.setItem(`last_synced_documents`, timestamp);
      
      // Supprimer tout marqueur de synchronisation en attente
      clearPendingSync('documents');
      
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec la base de données Infomaniak.",
      });
      return true;
    } else {
      throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
    }
  } catch (firstError) {
    console.warn("Première tentative de synchronisation échouée:", firstError);
    
    // Deuxième tentative - URL alternative
    try {
      const apiAltUrl = `/sites/qualiopi.ch/api`;
      console.log("Tentative avec URL alternative:", apiAltUrl);
      
      const response = await fetch(`${apiAltUrl}/documents-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser,
          documents: validDocuments
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP alternative ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Résultat de la synchronisation des documents (URL alternative):", result);
      
      if (result.success === true) {
        // Enregistrer la date de la dernière synchronisation réussie
        const timestamp = new Date().toISOString();
        localStorage.setItem(`last_synced_documents`, timestamp);
        sessionStorage.setItem(`last_synced_documents`, timestamp);
        
        // Supprimer tout marqueur de synchronisation en attente
        clearPendingSync('documents');
        
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec la base de données Infomaniak (URL alternative).",
        });
        return true;
      } else {
        throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
      }
    } catch (secondError) {
      console.error("Toutes les tentatives de synchronisation vers le serveur ont échoué:", secondError);
      
      // Marquer comme en attente de synchronisation pour une tentative ultérieure
      markPendingSync('documents');
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Les documents ont été sauvegardés localement, mais la synchronisation avec le serveur a échoué.",
      });
      
      return false;
    }
  }
};

/**
 * Récupération des documents locaux (mode hors ligne)
 */
export const getLocalDocuments = (userId: string | null = null): Document[] => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  
  // AMÉLIORATION: Utiliser le système de stockage centralisé
  const localDocs = loadLocalData<Document>('documents', currentUser);
  
  if (localDocs.length > 0) {
    console.log(`${localDocs.length} documents chargés depuis le stockage local`);
    return localDocs;
  }
  
  // Rétrocompatibilité : vérifier aussi l'ancien emplacement de stockage
  const storedData = localStorage.getItem(`documents_${currentUser}`);
  
  if (storedData) {
    try {
      const docs = JSON.parse(storedData);
      console.log(`${docs.length} documents chargés depuis l'ancien emplacement de stockage local`);
      
      // Migrer les données vers le nouveau système
      if (docs.length > 0) {
        saveLocalData('documents', docs, currentUser);
      }
      
      return docs;
    } catch (e) {
      console.error('Erreur lors de la lecture des documents locaux:', e);
    }
  } else {
    console.log('Aucun document trouvé dans le stockage local');
  }
  
  return [];
};

/**
 * Force une synchronisation complète depuis la base de données
 */
export const forceFullSync = async (userId: string | null = null): Promise<boolean> => {
  try {
    console.log("Forçage d'une synchronisation complète depuis la base de données Infomaniak");
    
    // D'abord, charger les données actuelles du serveur
    const documents = await loadDocumentsFromServer(userId);
    
    // Ensuite, s'assurer qu'elles sont bien enregistrées localement
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    saveLocalData('documents', documents, currentUser);
    
    // Supprimer tout marqueur de synchronisation en attente
    clearPendingSync('documents');
    
    // Enregistrer la date de la dernière synchronisation réussie
    const timestamp = new Date().toISOString();
    localStorage.setItem(`last_synced_documents`, timestamp);
    sessionStorage.setItem(`last_synced_documents`, timestamp);
    
    toast({
      title: "Synchronisation forcée réussie",
      description: `${documents.length} documents chargés depuis la base de données Infomaniak.`,
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la synchronisation forcée:", error);
    
    toast({
      variant: "destructive",
      title: "Échec de la synchronisation forcée",
      description: "Impossible de forcer la synchronisation avec la base de données.",
    });
    
    return false;
  }
};

/**
 * Fusionne les documents locaux avec les documents du serveur
 * Stratégie: conserve les modifications locales plus récentes
 */
function mergeDocuments(localDocs: Document[], serverDocs: Document[]): Document[] {
  if (!localDocs || localDocs.length === 0) return serverDocs;
  if (!serverDocs || serverDocs.length === 0) return localDocs;
  
  // Créer une map des documents locaux pour accès rapide
  const localDocsMap = new Map<string, Document>();
  localDocs.forEach(doc => {
    localDocsMap.set(doc.id, doc);
  });
  
  // Fusionner les documents
  const mergedDocs: Document[] = [];
  
  // Traiter les documents du serveur
  serverDocs.forEach(serverDoc => {
    const localDoc = localDocsMap.get(serverDoc.id);
    
    // Si le document existe localement
    if (localDoc) {
      // Comparer les dates de modification si disponibles
      const serverModDate = serverDoc.date_modification ? new Date(serverDoc.date_modification) : null;
      const localModDate = localDoc.date_modification ? new Date(localDoc.date_modification) : null;
      
      // Privilégier la version la plus récente
      if (localModDate && serverModDate && localModDate > serverModDate) {
        mergedDocs.push(localDoc);
        console.log(`Document ${localDoc.id} : version locale plus récente conservée`);
      } else {
        mergedDocs.push(serverDoc);
        console.log(`Document ${serverDoc.id} : version serveur conservée`);
      }
      
      // Supprimer de la map locale pour ne pas le traiter à nouveau
      localDocsMap.delete(serverDoc.id);
    } else {
      // Document existe seulement sur le serveur
      mergedDocs.push(serverDoc);
    }
  });
  
  // Ajouter les documents qui existent uniquement en local
  localDocsMap.forEach(localOnlyDoc => {
    mergedDocs.push(localOnlyDoc);
    console.log(`Document ${localOnlyDoc.id} : existe uniquement en local, ajouté à la fusion`);
  });
  
  console.log(`Fusion des documents : ${localDocs.length} locaux + ${serverDocs.length} serveur = ${mergedDocs.length} fusionnés`);
  return mergedDocs;
}
