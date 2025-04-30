
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Chargement des documents depuis le serveur pour un utilisateur spécifique
 * Priorise toujours la base de données Infomaniak
 */
export const loadDocumentsFromServer = async (userId: string | null = null): Promise<Document[]> => {
  const currentUser = userId || getCurrentUser() || 'p71x6d_system';
  console.log(`Chargement des documents pour l'utilisateur ${currentUser} (priorité serveur)`);
  
  let documents: Document[] = [];
  
  // Essayer d'abord de récupérer depuis le localStorage (pour éviter les pertes de données)
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
      headers: getAuthHeaders(),
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
    }
    
    // Sauvegarder localement pour accès hors ligne
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
    console.log(`${documents.length} documents sauvegardés localement pour accès hors ligne`);
    
    // Informer l'utilisateur que les données ont été chargées depuis le serveur
    toast({
      title: "Données synchronisées",
      description: `${documents.length} documents chargés depuis le serveur Infomaniak`,
    });
    
    return documents;
  } catch (firstError) {
    console.warn("Première tentative de chargement échouée:", firstError);
    
    // Deuxième tentative - URL alternative
    try {
      const apiAltUrl = `/sites/qualiopi.ch/api`;
      console.log("Tentative avec URL alternative:", apiAltUrl);
      
      const response = await fetch(`${apiAltUrl}/documents-load.php?userId=${currentUser}`, {
        method: 'GET',
        headers: getAuthHeaders(),
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
      }
      
      // Sauvegarder localement pour accès hors ligne
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
      console.log(`${documents.length} documents sauvegardés localement pour accès hors ligne (source: URL alternative)`);
      
      toast({
        title: "Données synchronisées",
        description: `${documents.length} documents chargés depuis le serveur Infomaniak (URL alternative)`,
      });
      
      return documents;
    } catch (secondError) {
      console.error("Toutes les tentatives de chargement depuis le serveur ont échoué:", secondError);
      
      // En dernier recours, retourner les documents locaux
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les documents depuis le serveur. Mode hors-ligne activé.",
      });
      
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
  
  // Assurer que les documents ont un ID valide
  const validDocuments = documents.map(doc => ({
    ...doc,
    id: doc.id || crypto.randomUUID()
  }));
  
  // IMPORTANT: Sauvegarder localement IMMÉDIATEMENT pour éviter les pertes de données
  localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
  console.log(`Documents sauvegardés localement en priorité pour éviter les pertes`);
  
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
      localStorage.setItem(`last_synced_documents`, new Date().toISOString());
      
      // Supprimer tout marqueur de synchronisation en attente
      localStorage.removeItem(`sync_pending_documents`);
      
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
        localStorage.setItem(`last_synced_documents`, new Date().toISOString());
        
        // Supprimer tout marqueur de synchronisation en attente
        localStorage.removeItem(`sync_pending_documents`);
        
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
      localStorage.setItem(`sync_pending_documents`, new Date().toISOString());
      
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
  const storedData = localStorage.getItem(`documents_${currentUser}`);
  
  if (storedData) {
    try {
      const docs = JSON.parse(storedData);
      console.log(`${docs.length} documents chargés depuis le stockage local (mode hors ligne)`);
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
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
    
    // Supprimer tout marqueur de synchronisation en attente
    localStorage.removeItem(`sync_pending_documents`);
    
    // Enregistrer la date de la dernière synchronisation réussie
    localStorage.setItem(`last_synced_documents`, new Date().toISOString());
    
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
