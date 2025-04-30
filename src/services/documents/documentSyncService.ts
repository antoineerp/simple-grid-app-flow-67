
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Chargement des documents depuis le serveur pour un utilisateur spécifique
 * Avec gestion améliorée des erreurs pour les environnements d'hébergement variés
 */
export const loadDocumentsFromServer = async (userId: string | null = null): Promise<Document[]> => {
  try {
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    console.log(`Chargement des documents pour l'utilisateur ${currentUser}`);
    
    // Construire l'URL
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/documents-load.php`;
    
    try {
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
        documents = [];
      }
      
      // Sauvegarder localement pour accès hors ligne
      localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
      
      return documents;
    } catch (err) {
      console.warn("Première tentative de chargement échouée:", err);
      
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
          documents = [];
        }
        
        // Sauvegarder localement pour accès hors ligne
        localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
        
        return documents;
      } catch (err2) {
        console.error("Deuxième tentative de chargement également échouée:", err2);
        
        // Essayer de charger depuis le stockage local
        const localDocuments = getLocalDocuments(currentUser);
        if (localDocuments.length > 0) {
          return localDocuments;
        }
        
        throw new Error(`Impossible de charger les documents: ${err}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des documents:', error);
    
    // Informer l'utilisateur de l'erreur avec un toast
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: "Impossible de charger les documents depuis le serveur. Mode hors-ligne activé.",
    });
    
    // Retourner les documents locaux s'ils existent
    return getLocalDocuments(userId);
  }
};

/**
 * Synchronisation des documents avec le serveur
 * Avec gestion améliorée des erreurs et mode de secours local
 */
export const syncDocumentsWithServer = async (documents: Document[], userId: string | null = null): Promise<boolean> => {
  try {
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    console.log(`Synchronisation des documents pour l'utilisateur ${currentUser}`);
    
    // Construire l'URL
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/documents-sync.php`;
    
    // Assurer que les documents ont un ID valide
    const validDocuments = documents.map(doc => ({
      ...doc,
      id: doc.id || crypto.randomUUID()
    }));
    
    try {
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
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Résultat de la synchronisation des documents:", result);
      
      if (result.success === true) {
        // Sauvegarder localement également
        localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
        
        toast({
          title: "Synchronisation réussie",
          description: "Les documents ont été synchronisés avec le serveur.",
        });
        return true;
      } else {
        throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
      }
    } catch (err) {
      console.warn("Première tentative de synchronisation échouée:", err);
      
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
          // Sauvegarder localement également
          localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
          
          toast({
            title: "Synchronisation réussie",
            description: "Les documents ont été synchronisés avec le serveur.",
          });
          return true;
        } else {
          throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
        }
      } catch (err2) {
        console.error("Deuxième tentative de synchronisation également échouée:", err2);
        
        // Enregistrer localement comme solution de secours
        localStorage.setItem(`documents_${currentUser}`, JSON.stringify(validDocuments));
        
        toast({
          variant: "warning",
          title: "Synchronisation en mode hors-ligne",
          description: "Les documents ont été sauvegardés localement. La synchronisation avec le serveur sera tentée ultérieurement.",
        });
        
        // Indiquer qu'une synchronisation est en attente
        localStorage.setItem(`sync_pending_documents`, new Date().toISOString());
        
        // Retourner true car les données sont au moins sauvegardées localement
        return true;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des documents:', error);
    
    // Sauvegarde locale comme solution de secours
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
    
    // Indiquer qu'une synchronisation est en attente
    localStorage.setItem(`sync_pending_documents`, new Date().toISOString());
    
    toast({
      variant: "destructive",
      title: "Erreur de synchronisation",
      description: "Les documents ont été sauvegardés localement, mais la synchronisation avec le serveur a échoué.",
    });
    
    return false;
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
      return JSON.parse(storedData);
    } catch (e) {
      console.error('Erreur lors de la lecture des documents locaux:', e);
    }
  }
  
  return [];
};
