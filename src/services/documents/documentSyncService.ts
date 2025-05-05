
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
    
    // Mécanisme de retry avec deux URL alternatives (avec et sans sous-répertoire)
    let response;
    let error1;
    
    try {
      // Première tentative - URL standard
      response = await fetch(`${getApiUrl()}/documents-load.php?userId=${currentUser}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
    } catch (err) {
      error1 = err;
      console.warn("Première tentative de chargement échouée:", err);
      
      try {
        // Deuxième tentative - URL alternative pour environnement Infomaniak
        const apiAltUrl = `/sites/qualiopi.ch/api`;
        console.log("Tentative avec URL alternative:", apiAltUrl);
        
        response = await fetch(`${apiAltUrl}/documents-load.php?userId=${currentUser}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
      } catch (err2) {
        console.error("Deuxième tentative de chargement également échouée:", err2);
        throw new Error(`Impossible de charger les documents: ${err} / ${err2}`);
      }
    }
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Documents chargés depuis le serveur:", result);
    
    if (result.success && Array.isArray(result.documents)) {
      return result.documents;
    } else if (Array.isArray(result)) {
      return result;
    }
    
    // Si le serveur ne retourne pas la structure attendue, afficher un toast d'avertissement
    toast({
      variant: "destructive",
      title: "Format de données inattendu",
      description: "Le serveur a répondu mais le format des données n'est pas celui attendu. Mode hors-ligne activé."
    });
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des documents:', error);
    
    // Informer l'utilisateur de l'erreur avec un toast
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: "Impossible de charger les documents depuis le serveur. Mode hors-ligne activé.",
    });
    
    // En cas d'erreur, renvoyer un tableau vide
    return [];
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
    
    // Essayer de synchroniser avec le serveur
    let response;
    let error1;
    
    try {
      // Première tentative - URL standard
      response = await fetch(`${getApiUrl()}/documents-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser,
          documents: documents
        })
      });
    } catch (err) {
      error1 = err;
      console.warn("Première tentative de synchronisation échouée:", err);
      
      try {
        // Deuxième tentative - URL alternative pour environnement Infomaniak
        const apiAltUrl = `/sites/qualiopi.ch/api`;
        console.log("Tentative avec URL alternative:", apiAltUrl);
        
        response = await fetch(`${apiAltUrl}/documents-sync.php`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser,
            documents: documents
          })
        });
      } catch (err2) {
        console.error("Deuxième tentative de synchronisation également échouée:", err2);
        
        // Enregistrer localement comme solution de secours et informer l'utilisateur
        localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
        
        toast({
          variant: "destructive",
          title: "Synchronisation en mode hors-ligne",
          description: "Les documents ont été sauvegardés localement. La synchronisation avec le serveur sera tentée ultérieurement.",
        });
        
        // Retourner true car les données sont au moins sauvegardées localement
        return true;
      }
    }
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents:", result);
    
    if (result.success === true) {
      toast({
        title: "Synchronisation réussie",
        description: "Les documents ont été synchronisés avec le serveur.",
      });
      return true;
    } else {
      throw new Error("La synchronisation a échoué: " + (result.message || "Raison inconnue"));
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des documents:', error);
    
    // Sauvegarde locale comme solution de secours
    const currentUser = userId || getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(documents));
    
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
