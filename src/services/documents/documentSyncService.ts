
/**
 * Service de synchronisation des documents
 * Utilise le nouveau système de synchronisation automatique centralisée
 */

import { Document } from '@/types/documents';
import { getCurrentUser } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';
import { saveLocalData, loadLocalData, syncWithServer } from '@/services/sync/AutoSyncService';
import robustSync, { verifyJsonEndpoint } from '@/services/sync/robustSyncService';
import { ensureCorrectUserId } from '@/services/core/userIdConverter';

// Sauvegarde des documents en local (maintenu pour compatibilité)
export const saveLocalDocuments = (docs: Document[]): void => {
  try {
    const currentUser = ensureCorrectUserId(getCurrentUser()) || 'default';
    
    // Utiliser le nouveau système de stockage centralisé
    saveLocalData('documents', docs);
    console.log(`${docs.length} documents sauvegardés en local pour ${currentUser}`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale des documents:', error);
  }
};

// Récupération des documents en local (maintenu pour compatibilité)
export const getLocalDocuments = (): Document[] => {
  try {
    // Utiliser le nouveau système de stockage centralisé
    const docs = loadLocalData<Document>('documents');
    console.log(`${docs.length} documents récupérés en local`);
    return docs;
  } catch (error) {
    console.error('Erreur lors de la récupération locale des documents:', error);
    return [];
  }
};

// Synchronisation des documents avec le serveur avec gestion d'erreur améliorée
export const syncDocumentsWithServer = async (docs: Document[]): Promise<boolean> => {
  if (!docs || docs.length === 0) {
    console.log('Aucun document à synchroniser');
    return true; // Considéré comme un succès car il n'y a rien à faire
  }
  
  console.log(`Début de la synchronisation de ${docs.length} documents...`);
  
  try {
    // Utiliser le nouveau système de synchronisation automatique
    return await syncWithServer('documents', docs);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des documents:', error);
    
    // Si c'est une erreur de parsing JSON, sauvegarder une copie de sauvegarde des données
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.warn('Erreur de parsing JSON détectée, sauvegarde des données en mode récupération');
      try {
        // Sauvegarder une copie de sauvegarde avec un timestamp
        const timestamp = new Date().getTime();
        const recoveryKey = `documents_recovery_${timestamp}`;
        localStorage.setItem(recoveryKey, JSON.stringify(docs));
        console.log(`Sauvegarde de récupération créée: ${recoveryKey}`);
      } catch (backupError) {
        console.error('Échec de la sauvegarde de récupération:', backupError);
      }
    }
    
    return false;
  }
};

// Force une synchronisation complète de tous les documents
export const forceFullSync = async (): Promise<boolean> => {
  console.log('Forçage de la synchronisation complète des documents...');
  
  try {
    // Récupérer tous les documents locaux
    const documents = getLocalDocuments();
    
    if (!documents || documents.length === 0) {
      console.log('Aucun document à synchroniser');
      toast({
        title: 'Aucune donnée à synchroniser',
        description: 'Aucun document trouvé localement pour la synchronisation.'
      });
      return true;
    }
    
    // Synchroniser les documents avec le serveur
    const success = await syncDocumentsWithServer(documents);
    
    if (success) {
      toast({
        title: 'Synchronisation réussie',
        description: `${documents.length} documents ont été synchronisés avec le serveur.`
      });
      return true;
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la synchronisation',
        description: 'Impossible de synchroniser les documents avec le serveur.'
      });
      return false;
    }
  } catch (error) {
    console.error('Erreur lors du forçage de la synchronisation:', error);
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    return false;
  }
};

// Chargement des documents depuis le serveur
export const loadDocumentsFromServer = async (userId?: string): Promise<Document[] | null> => {
  const currentUser = ensureCorrectUserId(userId || getCurrentUser()) || 'default';
  
  console.log(`Chargement des documents pour ${currentUser} depuis le serveur...`);
  
  try {
    // Pour cette version simplifiée, on récupère simplement les données locales
    // Dans une implémentation réelle, il faudrait faire une requête au serveur
    return loadLocalData<Document>('documents');
  } catch (error) {
    console.error('Erreur lors du chargement des documents depuis le serveur:', error);
    return null;
  }
};
