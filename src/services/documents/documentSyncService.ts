
/**
 * Service unifié de synchronisation des documents
 * Utilise exclusivement la base p71x6d_richard sur Infomaniak
 */

import { Document } from '@/types/documents';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/hooks/use-toast'; 
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Base de données fixe
const FIXED_DB_USER = 'p71x6d_richard';
const INFOMANIAK_HOST = 'p71x6d.myd.infomaniak.com';

// Sauvegarde des documents en local (uniquement comme cache temporaire)
export const saveLocalDocuments = (docs: Document[]): void => {
  try {
    console.log(`DocumentSyncService: Sauvegarde locale temporaire de ${docs.length} documents`);
    
    // Récupérer le préfixe utilisateur pour la séparation des données
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    const storageKey = `documents_${FIXED_DB_USER}_${userPrefix}`;
    
    localStorage.setItem(storageKey, JSON.stringify(docs));
    localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString());
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la sauvegarde temporaire:', error);
  }
};

// Récupération des documents en local (uniquement comme cache temporaire)
export const getLocalDocuments = (): Document[] => {
  try {
    // Récupérer le préfixe utilisateur pour la séparation des données
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    const storageKey = `documents_${FIXED_DB_USER}_${userPrefix}`;
    
    const data = localStorage.getItem(storageKey);
    if (!data) {
      console.log('DocumentSyncService: Aucun document en cache local');
      return [];
    }
    
    const docs = JSON.parse(data) as Document[];
    console.log(`DocumentSyncService: ${docs.length} documents récupérés du cache local`);
    return docs;
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la récupération du cache:', error);
    return [];
  }
};

// Synchronisation des documents avec le serveur - TOUJOURS via p71x6d_richard
export const syncDocumentsWithServer = async (docs: Document[]): Promise<boolean> => {
  if (!docs || docs.length === 0) {
    console.log('DocumentSyncService: Aucun document à synchroniser');
    return true;
  }
  
  console.log(`DocumentSyncService: Synchronisation de ${docs.length} documents avec ${FIXED_DB_USER}`);
  
  try {
    // Normaliser les documents pour la synchronisation
    const normalizedDocs = docs.map(doc => ({
      id: doc.id,
      nom: doc.nom || doc.name || '', 
      fichier_path: doc.fichier_path || null,
      responsabilites: doc.responsabilites || null,
      etat: doc.etat || doc.statut || null,
      groupId: doc.groupId || null,
      excluded: doc.excluded || false
    }));
    
    // Toujours utiliser l'ID fixe p71x6d_richard
    const userId = FIXED_DB_USER;
    
    // Récupérer le préfixe utilisateur pour la séparation des données
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    const origUserId = localStorage.getItem('originalUserId') || getCurrentUser();
    
    // Préparer les données de synchronisation
    const syncData = {
      userId: userId,
      userPrefix: userPrefix,
      originalUserId: origUserId,
      documents: normalizedDocs,
      timestamp: new Date().toISOString()
    };
    
    const apiUrl = getApiUrl();
    // Utiliser documents-sync.php directement au lieu de db-fetch.php
    const syncUrl = `${apiUrl}/documents-sync.php`;
    
    console.log(`DocumentSyncService: Envoi à ${syncUrl}`);
    console.log(`DocumentSyncService: Base: ${FIXED_DB_USER}, Préfixe: ${userPrefix}, ID original: ${origUserId}`);
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(syncData)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success && result.status !== 'success') {
      throw new Error(result.message || 'Échec de la synchronisation');
    }
    
    console.log(`DocumentSyncService: Synchronisation réussie de ${result.count || docs.length} documents`);
    return true;
  } catch (error) {
    console.error('DocumentSyncService: Erreur de synchronisation:', error);
    toast({
      variant: "destructive",
      title: "Erreur de synchronisation",
      description: error instanceof Error ? error.message : "Erreur inconnue"
    });
    return false;
  }
};

// Récupération des documents depuis le serveur - TOUJOURS via p71x6d_richard
export const fetchDocumentsFromServer = async (): Promise<Document[]> => {
  try {
    // Toujours utiliser l'ID fixe p71x6d_richard
    const userId = FIXED_DB_USER;
    
    // Récupérer le préfixe utilisateur pour la séparation des données
    const userPrefix = localStorage.getItem('userPrefix') || 'u1';
    const origUserId = localStorage.getItem('originalUserId') || getCurrentUser();
    
    console.log(`DocumentSyncService: Récupération depuis le serveur avec Base: ${userId}, Préfixe: ${userPrefix}, ID original: ${origUserId}`);
    
    const apiUrl = getApiUrl();
    // Utiliser documents-sync.php directement au lieu de db-fetch.php
    const fetchUrl = `${apiUrl}/documents-sync.php?userId=${userId}`;
    
    console.log(`DocumentSyncService: Récupération depuis ${fetchUrl}`);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success === false) {
      throw new Error(data.message || 'Échec de récupération des documents');
    }
    
    // Traiter les documents directement depuis la réponse
    let documents: Document[] = [];
    
    if (data.documents && Array.isArray(data.documents)) {
      documents = data.documents.map((record: any) => {
        const responsabilitesData = record.responsabilites ? 
          (typeof record.responsabilites === 'string' ? 
            JSON.parse(record.responsabilites) : record.responsabilites) : 
          { r: [], a: [], c: [], i: [] };
          
        return {
          id: record.id || '',
          nom: record.nom || record.name || 'Document sans nom',
          fichier_path: record.fichier_path || null,
          responsabilites: responsabilitesData,
          etat: record.etat || null,
          groupId: record.groupId || null,
          excluded: record.excluded ? true : false,
          date_creation: record.date_creation ? new Date(record.date_creation) : new Date(),
          date_modification: record.date_modification ? new Date(record.date_modification) : new Date()
        };
      });
    }
    
    console.log(`DocumentSyncService: ${documents.length} documents récupérés du serveur`);
    saveLocalDocuments(documents);
    return documents;
    
  } catch (error) {
    console.error('DocumentSyncService: Erreur lors de la récupération:', error);
    toast({
      variant: "destructive",
      title: "Erreur de chargement",
      description: error instanceof Error ? error.message : "Impossible de charger les documents"
    });
    
    // En cas d'erreur, retourner les documents du cache local
    return getLocalDocuments();
  }
};

// Forcer une synchronisation complète avec le serveur
export const forceFullSync = async (): Promise<boolean> => {
  console.log("DocumentSyncService: Démarrage d'une synchronisation forcée");
  
  try {
    // D'abord récupérer les données du serveur
    const serverDocuments = await fetchDocumentsFromServer();
    
    if (!serverDocuments || serverDocuments.length === 0) {
      console.log("DocumentSyncService: Aucun document sur le serveur");
      return true;
    }
    
    // Enregistrer localement
    saveLocalDocuments(serverDocuments);
    
    console.log(`DocumentSyncService: Synchronisation forcée réussie pour ${serverDocuments.length} documents`);
    
    // Notifier l'application
    const syncEvent = new CustomEvent('documents-sync-complete', {
      detail: { 
        timestamp: new Date().toISOString(),
        count: serverDocuments.length
      }
    });
    window.dispatchEvent(syncEvent);
    
    return true;
  } catch (error) {
    console.error("DocumentSyncService: Erreur lors de la synchronisation forcée:", error);
    return false;
  }
};
