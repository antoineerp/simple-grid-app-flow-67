
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
    
    let documents: Document[] = [];
    
    if (result.success && Array.isArray(result.documents)) {
      documents = result.documents;
    } else if (Array.isArray(result)) {
      documents = result;
    } else if (result.records && Array.isArray(result.records)) {
      documents = result.records;
    } else {
      console.warn("Format de réponse non reconnu pour les documents");
      throw new Error("Format de réponse non reconnu");
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
      
      let documents: Document[] = [];
      
      if (result.success && Array.isArray(result.documents)) {
        documents = result.documents;
      } else if (Array.isArray(result)) {
        documents = result;
      } else if (result.records && Array.isArray(result.records)) {
        documents = result.records;
      } else {
        console.warn("Format de réponse alternative non reconnu pour les documents");
        throw new Error("Format de réponse alternative non reconnu");
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
      
      // En dernier recours, essayer de charger depuis le stockage local
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les documents depuis le serveur. Mode hors-ligne activé.",
      });
      
      return getLocalDocuments(userId);
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
      // Sauvegarder localement également pour le mode hors ligne
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
      
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
        // Sauvegarder localement également pour le mode hors ligne
        localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
        
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
      
      // Enregistrer localement comme solution de secours
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
      
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
