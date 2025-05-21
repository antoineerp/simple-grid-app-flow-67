
/**
 * Service de synchronisation des documents
 * Utilise le nouveau système de synchronisation automatique centralisée
 */

import { Document } from '@/types/documents';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
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
    // Normaliser les documents pour la synchronisation
    const normalizedDocs = docs.map(doc => ({
      id: doc.id,
      nom: doc.nom || '',
      fichier_path: doc.fichier_path || null,
      responsabilites: doc.responsabilites || null,
      etat: doc.etat || null,
      groupId: doc.groupId || null
    }));
    
    // Obtenir l'ID utilisateur correctement formaté
    const userId = ensureCorrectUserId(getCurrentUser());
    
    // Préparer les données de synchronisation
    const syncData = {
      userId: userId,
      documents: normalizedDocs,
      timestamp: new Date().toISOString()
    };
    
    const apiUrl = getApiUrl();
    const syncUrl = `${apiUrl}/documents-sync.php`;
    
    console.log(`Envoi de la requête de synchronisation à ${syncUrl}`);
    console.log(`ID utilisateur: ${userId}`);
    
    // Appliquer un délai court pour éviter les problèmes de synchronisation rapide
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': 'FormaCert-App/1.0 (Synchronisation; QualiAPI)'
      },
      body: JSON.stringify(syncData),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Lire et valider la réponse
    const responseText = await response.text();
    console.log(`Réponse brute du serveur: ${responseText.substring(0, 200)}`);
    
    // Analyser la réponse JSON
    try {
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(result.message || 'Échec de la synchronisation');
      }
      
      console.log(`Synchronisation réussie de ${result.count} documents`);
      return true;
    } catch (jsonError) {
      console.error('Erreur lors du parsing de la réponse JSON:', jsonError);
      
      // Si la réponse est vide mais le statut est 200, considérer comme succès
      if (response.ok && (!responseText || responseText.trim() === '')) {
        console.log('Réponse vide mais statut OK, considéré comme succès');
        return true;
      }
      
      throw new Error('Réponse invalide du serveur');
    }
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
