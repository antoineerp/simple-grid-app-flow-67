/**
 * Service de synchronisation des documents
 * Utilise le système de synchronisation avec p71x6d_richard
 */

import { Document } from '@/types/documents';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/hooks/use-toast'; 
import { getApiUrl } from '@/config/apiConfig';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';
import { saveLocalData, loadLocalData } from '@/features/sync/utils/syncStorageManager';

// Base de données fixe
const FIXED_DB_USER = 'p71x6d_richard';
const INFOMANIAK_HOST = 'p71x6d.myd.infomaniak.com';

// Sauvegarde des documents en local
export const saveLocalDocuments = (docs: Document[]): void => {
  try {
    console.log(`DocumentSyncService: Sauvegarde locale de ${docs.length} documents avec base ${FIXED_DB_USER}`);
    
    // Utiliser le nouveau système de stockage centralisé
    saveLocalData('documents', docs, FIXED_DB_USER);
    
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la sauvegarde locale des documents:', error);
  }
};

// Récupération des documents en local
export const getLocalDocuments = (): Document[] => {
  try {
    console.log(`DocumentSyncService: Chargement local des documents depuis base ${FIXED_DB_USER}`);
    
    // Utiliser le nouveau système de stockage centralisé
    const docs = loadLocalData<Document>('documents', FIXED_DB_USER);
    console.log(`DocumentSyncService: ${docs.length} documents récupérés en local`);
    return docs;
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la récupération locale des documents:', error);
    return [];
  }
};

// Synchronisation des documents avec le serveur avec gestion d'erreur améliorée
export const syncDocumentsWithServer = async (docs: Document[]): Promise<boolean> => {
  if (!docs || docs.length === 0) {
    console.log('DocumentSyncService: Aucun document à synchroniser');
    return true; // Considéré comme un succès car il n'y a rien à faire
  }
  
  console.log(`DocumentSyncService: Début de la synchronisation de ${docs.length} documents avec ${FIXED_DB_USER} sur ${INFOMANIAK_HOST}`);
  
  try {
    // Normaliser les documents pour la synchronisation
    const normalizedDocs = docs.map(doc => ({
      id: doc.id,
      // Handle both 'nom' and 'name' for compatibility
      nom: doc.nom || doc.name || '', 
      fichier_path: doc.fichier_path || null,
      responsabilites: doc.responsabilites || null,
      // Handle both 'etat' and 'statut' for compatibility
      etat: doc.etat || doc.statut || null,
      groupId: doc.groupId || null,
      excluded: doc.excluded || false
    }));
    
    // Utiliser l'ID utilisateur fixe
    const userId = FIXED_DB_USER;
    
    // Ajouter un préfixe utilisateur pour la séparation des données
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    
    // Préparer les données de synchronisation
    const syncData = {
      userId: userId,
      userPrefix: userPrefix, // Envoyer le préfixe utilisateur pour distinguer les données
      documents: normalizedDocs,
      timestamp: new Date().toISOString()
    };
    
    const apiUrl = getApiUrl();
    const syncUrl = `${apiUrl}/documents-sync.php`;
    
    console.log(`DocumentSyncService: Envoi de la requête de synchronisation à ${syncUrl}`);
    console.log(`DocumentSyncService: Base fixe: ${FIXED_DB_USER}, Préfixe utilisateur: ${userPrefix}`);
    
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
      console.error(`DocumentSyncService: Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
    
    // Lire et valider la réponse
    const responseText = await response.text();
    console.log(`DocumentSyncService: Réponse brute du serveur: ${responseText.substring(0, 200)}`);
    
    // Analyser la réponse JSON
    try {
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(result.message || 'Échec de la synchronisation');
      }
      
      console.log(`DocumentSyncService: Synchronisation réussie de ${result.count} documents`);
      return true;
    } catch (jsonError) {
      console.error('DocumentSyncService: Erreur lors du parsing de la réponse JSON:', jsonError);
      
      // Si la réponse est vide mais le statut est 200, considérer comme succès
      if (response.ok && (!responseText || responseText.trim() === '')) {
        console.log('DocumentSyncService: Réponse vide mais statut OK, considéré comme succès');
        return true;
      }
      
      throw new Error('Réponse invalide du serveur');
    }
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la synchronisation des documents:', error);
    return false;
  }
};

// Récupérer des documents depuis le serveur
export const fetchDocumentsFromServer = async (): Promise<Document[]> => {
  try {
    console.log(`DocumentSyncService: Récupération des documents depuis le serveur avec ${FIXED_DB_USER}`);
    
    const apiUrl = getApiUrl();
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    
    const fetchUrl = `${apiUrl}/documents-fetch.php?userId=${FIXED_DB_USER}&userPrefix=${userPrefix}`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Échec de récupération des documents');
    }
    
    console.log(`DocumentSyncService: ${data.documents.length} documents récupérés depuis le serveur`);
    return data.documents;
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la récupération des documents:', error);
    return [];
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
