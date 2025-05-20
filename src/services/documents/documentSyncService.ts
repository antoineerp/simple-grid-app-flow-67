
import { Document } from '@/types/documents';
import { getCurrentUser } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';
import robustSync from '@/services/sync/robustSyncService';

// Sauvegarde des documents en local
export const saveLocalDocuments = (docs: Document[]): void => {
  const currentUser = getCurrentUser() || 'default';
  try {
    localStorage.setItem(`documents_${currentUser}`, JSON.stringify(docs));
    console.log(`${docs.length} documents sauvegardés en local pour ${currentUser}`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale des documents:', error);
  }
};

// Récupération des documents en local
export const getLocalDocuments = (): Document[] => {
  const currentUser = getCurrentUser() || 'default';
  try {
    const storedDocs = localStorage.getItem(`documents_${currentUser}`);
    if (storedDocs) {
      const docs = JSON.parse(storedDocs);
      console.log(`${docs.length} documents récupérés en local pour ${currentUser}`);
      return docs;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération locale des documents:', error);
  }
  return [];
};

// Synchronisation des documents avec le serveur - Utilise le nouveau système robuste
export const syncDocumentsWithServer = async (docs: Document[]): Promise<boolean> => {
  if (!docs || docs.length === 0) {
    console.log('Aucun document à synchroniser');
    return true; // Considéré comme un succès car il n'y a rien à faire
  }
  
  console.log(`Début de la synchronisation de ${docs.length} documents...`);
  
  const result = await robustSync.syncData('documents', docs, {
    retryCount: 3, 
    validate: true
  });
  
  if (result.success) {
    console.log('Synchronisation réussie:', result.message);
    return true;
  } else {
    console.error('Échec de la synchronisation:', result.message);
    return false;
  }
};

// Chargement des documents depuis le serveur
export const loadDocumentsFromServer = async (userId?: string): Promise<Document[] | null> => {
  const currentUser = userId || getCurrentUser() || 'default';
  
  console.log(`Chargement des documents pour ${currentUser} depuis le serveur...`);
  
  try {
    // Vérifier d'abord la validité de l'API
    const isApiValid = await robustSync.verifyJsonEndpoint();
    
    if (!isApiValid) {
      console.error('Le point de terminaison JSON n\'est pas valide');
      toast({
        variant: "destructive",
        title: "Erreur de communication",
        description: "Le serveur ne répond pas correctement en format JSON."
      });
      return null;
    }
    
    // Ici on utiliserait idéalement une API pour charger les documents
    // Pour l'instant, on retourne les documents locaux comme solution temporaire
    const localDocs = getLocalDocuments();
    console.log(`Retour des ${localDocs.length} documents locaux (chargement serveur non implémenté)`);
    return localDocs;
    
  } catch (error) {
    console.error('Erreur lors du chargement des documents depuis le serveur:', error);
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: error instanceof Error ? error.message : "Erreur inconnue"
    });
    return null;
  }
};
