
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

/**
 * Chargement des documents depuis le serveur pour un utilisateur spécifique
 * Priorise toujours la base de données Infomaniak
 */
export const loadDocumentsFromServer = async (userId: string | null = null): Promise<Document[]> => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  console.log(`Chargement des documents pour l'utilisateur ${currentUser} (priorité serveur)`);
  
  // Dispatch un événement pour le monitoring
  window.dispatchEvent(new CustomEvent('syncStarted', { 
    detail: { tableName: 'documents', operation: 'load' }
  }));
  
  let documents: Document[] = [];
  
  // Essayer d'abord de récupérer depuis le stockage local (pour éviter les pertes de données)
  const localDocuments = getLocalDocuments(userId);
  if (localDocuments.length > 0) {
    console.log(`${localDocuments.length} documents trouvés dans le stockage local`);
    documents = localDocuments;
  }
  
  // Tentative de chargement depuis le serveur
  try {
    // Construire l'URL
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/documents-load.php`;
    
    console.log(`Tentative de chargement depuis: ${endpoint}`);
    
    // Première tentative - URL standard
    const response = await fetch(`${endpoint}?userId=${currentUser}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Documents chargés depuis le serveur:", result);
    
    let serverDocuments: Document[] = [];
    
    if (result.success && Array.isArray(result.documents)) {
      serverDocuments = result.documents;
    } else if (Array.isArray(result)) {
      serverDocuments = result;
    } else if (result.records && Array.isArray(result.records)) {
      serverDocuments = result.records;
    } else {
      console.warn("Format de réponse non reconnu pour les documents");
      throw new Error("Format de réponse non reconnu");
    }
    
    // Fusionner les documents locaux et ceux du serveur si nécessaire
    if (serverDocuments.length > 0) {
      documents = mergeDocuments(localDocuments, serverDocuments);
      
      // Dispatch un événement pour le monitoring
      window.dispatchEvent(new CustomEvent('syncCompleted', { 
        detail: { tableName: 'documents', count: documents.length }
      }));
    } else {
      console.warn("Aucun document reçu du serveur");
      
      // Si le serveur ne renvoie aucun document mais que nous en avons en local,
      // nous allons envoyer nos documents locaux au serveur
      if (localDocuments.length > 0) {
        console.log(`Envoi des ${localDocuments.length} documents locaux au serveur`);
        await syncDocumentsWithServer(localDocuments);
      }
    }
    
    // AMÉLIORATION: Sauvegarder dans les deux systèmes de stockage pour accès hors ligne
    saveLocalData('documents', documents, currentUser);
    
    console.log(`${documents.length} documents sauvegardés localement pour accès hors ligne`);
    
    return documents;
  } catch (firstError) {
    console.warn("Première tentative de chargement échouée:", firstError);
    
    // Deuxième tentative - URL alternative
    try {
      const apiAltUrl = `/sites/qualiopi.ch/api`;
      console.log("Tentative avec URL alternative:", apiAltUrl);
      
      const response = await fetch(`${apiAltUrl}/documents-load.php?userId=${currentUser}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP alternative ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Documents chargés depuis le serveur (URL alternative):", result);
      
      let serverDocuments: Document[] = [];
      
      if (result.success && Array.isArray(result.documents)) {
        serverDocuments = result.documents;
      } else if (Array.isArray(result)) {
        serverDocuments = result;
      } else if (result.records && Array.isArray(result.records)) {
        serverDocuments = result.records;
      } else {
        console.warn("Format de réponse alternative non reconnu pour les documents");
        throw new Error("Format de réponse alternative non reconnu");
      }
      
      // Fusionner les documents locaux et ceux du serveur si nécessaire
      if (serverDocuments.length > 0) {
        documents = mergeDocuments(localDocuments, serverDocuments);
        
        // Dispatch un événement pour le monitoring
        window.dispatchEvent(new CustomEvent('syncCompleted', { 
          detail: { tableName: 'documents', count: documents.length }
        }));
      } else {
        // Si le serveur ne renvoie aucun document mais que nous en avons en local,
        // nous allons envoyer nos documents locaux au serveur
        if (localDocuments.length > 0) {
          console.log(`Envoi des ${localDocuments.length} documents locaux au serveur (alternative)`);
          await syncDocumentsWithServer(localDocuments);
        }
      }
      
      // AMÉLIORATION: Sauvegarder dans les deux systèmes de stockage pour accès hors ligne
      saveLocalData('documents', documents, currentUser);
      
      console.log(`${documents.length} documents sauvegardés localement pour accès hors ligne (source: URL alternative)`);
      
      return documents;
    } catch (secondError) {
      console.error("Toutes les tentatives de chargement depuis le serveur ont échoué:", secondError);
      
      // Dispatch un événement pour le monitoring
      window.dispatchEvent(new CustomEvent('syncFailed', { 
        detail: { 
          tableName: 'documents', 
          operation: 'load',
          error: secondError instanceof Error ? secondError.message : 'Erreur inconnue'
        }
      }));
      
      // En dernier recours, retourner les documents locaux
      return localDocuments;
    }
  }
};

/**
 * Synchronisation des documents avec le serveur
 * Priorise toujours la base de données Infomaniak
 */
export const syncDocumentsWithServer = async (documents: Document[], userId: string | null = null): Promise<boolean> => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  console.log(`Synchronisation des documents pour l'utilisateur ${currentUser} (priorité serveur)`);
  
  // Générer un ID d'opération unique pour le monitoring
  const operationId = `documents_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Dispatch un événement pour le monitoring
  window.dispatchEvent(new CustomEvent('syncStarted', { 
    detail: { 
      tableName: 'documents', 
      operation: 'save',
      operationId
    }
  }));
  
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
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
      
      // Dispatch un événement pour le monitoring
      window.dispatchEvent(new CustomEvent('syncCompleted', { 
        detail: { 
          operationId,
          tableName: 'documents', 
          count: validDocuments.length
        }
      }));
      
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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
        
        // Dispatch un événement pour le monitoring
        window.dispatchEvent(new CustomEvent('syncCompleted', { 
          detail: { 
            operationId,
            tableName: 'documents', 
            count: validDocuments.length
          }
        }));
        
        return true;
      } else {
        throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
      }
    } catch (secondError) {
      console.error("Toutes les tentatives de synchronisation vers le serveur ont échoué:", secondError);
      
      // Dispatch un événement pour le monitoring
      window.dispatchEvent(new CustomEvent('syncFailed', { 
        detail: { 
          operationId,
          tableName: 'documents', 
          operation: 'save',
          error: secondError instanceof Error ? secondError.message : 'Erreur inconnue'
        }
      }));
      
      // Marquer comme en attente de synchronisation pour une tentative ultérieure
      markPendingSync('documents');
      
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
  // 1. D'abord vérifier dans sessionStorage (pour la persistance entre pages)
  const sessionData = sessionStorage.getItem(`documents_page_state_${currentUser}`);
  if (sessionData) {
    try {
      const parsedData = JSON.parse(sessionData);
      if (parsedData.documents && parsedData.documents.length > 0) {
        console.log(`${parsedData.documents.length} documents chargés depuis sessionStorage`);
        return parsedData.documents;
      }
    } catch (e) {
      console.error('Erreur lors du parsing des données de session:', e);
    }
  }
  
  // 2. Ensuite, vérifier dans le système de stockage centralisé
  const localDocs = loadLocalData<Document>('documents', currentUser);
  
  if (localDocs.length > 0) {
    console.log(`${localDocs.length} documents chargés depuis le stockage local`);
    
    // Sauvegarder également dans sessionStorage pour persistance entre pages
    sessionStorage.setItem(`documents_page_state_${currentUser}`, JSON.stringify({
      documents: localDocs,
      timestamp: new Date().toISOString()
    }));
    
    return localDocs;
  }
  
  // 3. Rétrocompatibilité : vérifier aussi l'ancien emplacement de stockage
  const storedData = localStorage.getItem(`documents_${currentUser}`);
  
  if (storedData) {
    try {
      const docs = JSON.parse(storedData);
      console.log(`${docs.length} documents chargés depuis l'ancien emplacement de stockage local`);
      
      // Migrer les données vers le nouveau système
      if (docs.length > 0) {
        saveLocalData('documents', docs, currentUser);
        
        // Sauvegarder également dans sessionStorage pour persistance entre pages
        sessionStorage.setItem(`documents_page_state_${currentUser}`, JSON.stringify({
          documents: docs,
          timestamp: new Date().toISOString()
        }));
      }
      
      return docs;
    } catch (e) {
      console.error('Erreur lors de la lecture des documents locaux:', e);
    }
  }
  
  console.log('Aucun document trouvé dans le stockage local');
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
