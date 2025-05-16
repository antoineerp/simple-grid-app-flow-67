
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getDatabaseConnectionCurrentUser } from './databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

// Liste des tables à initialiser pour chaque utilisateur
const TABLE_LIST = [
  'test_table',
  'documents',
  'exigences',
  'membres',
  'document_groups',
  'users_data'
];

// Importer les données du gestionnaire pour un utilisateur
export const adminImportFromManager = async (targetUserId?: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const currentUser = targetUserId || getDatabaseConnectionCurrentUser();
    
    // Si aucun utilisateur n'est spécifié, renvoyer une erreur
    if (!currentUser) {
      throw new Error("Aucun utilisateur spécifié pour l'import des données");
    }
    
    console.log(`Tentative d'import des données pour l'utilisateur: ${currentUser}`);
    
    const response = await fetch(`${API_URL}/manager-import`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUser: currentUser
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur pendant l'import depuis le gestionnaire:", error);
    throw error;
  }
};

// Fonction pour initialiser les tables d'un utilisateur
export const initializeUserTables = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    let allSuccess = true;
    
    // 1. Créer les tables de base pour l'utilisateur avec un suffixe spécifique à l'utilisateur
    // pour garantir l'isolation complète des données
    const dbUpdateUrl = `${API_URL}/db-update.php?userId=${encodeURIComponent(userId)}`;
    const dbUpdateResponse = await fetch(dbUpdateUrl, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache',
        ...getAuthHeaders()
      }
    });
    
    if (!dbUpdateResponse.ok) {
      console.error(`Erreur lors de la création des tables: ${dbUpdateResponse.status}`);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création des tables de base",
        variant: "destructive"
      });
      return false;
    }
    
    console.log("Tables de base créées avec succès pour l'utilisateur", userId);
    
    // 2. Pour chaque table dans la liste, créer la version spécifique à l'utilisateur
    for (const tableName of TABLE_LIST) {
      try {
        await initializeTable(tableName, userId);
        console.log(`Table ${tableName} initialisée pour l'utilisateur ${userId}`);
      } catch (error) {
        console.error(`Erreur lors de l'initialisation de la table ${tableName}:`, error);
        allSuccess = false;
      }
    }
    
    // 3. Importer les données du gestionnaire (ou de l'administrateur si pas de gestionnaire)
    try {
      const importUrl = `${API_URL}/manager-import`;
      const importResponse = await fetch(importUrl, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          targetUser: userId,
          ensureIsolation: true // Nouveau paramètre pour garantir l'isolation des données
        })
      });
      
      if (!importResponse.ok) {
        console.warn(`Import des données du gestionnaire non réussi: ${importResponse.status}`);
        allSuccess = false;
      } else {
        console.log("Données importées du gestionnaire avec succès pour l'utilisateur", userId);
      }
    } catch (error) {
      console.error("Erreur lors de l'import des données du gestionnaire:", error);
      allSuccess = false;
    }
    
    // 4. Synchroniser l'état entre appareils (mais uniquement pour cet utilisateur spécifique)
    try {
      const syncUrl = `${API_URL}/sync-devices.php?userId=${encodeURIComponent(userId)}`;
      const syncResponse = await fetch(syncUrl, {
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache',
          ...getAuthHeaders()
        }
      });
      
      if (syncResponse.ok) {
        console.log("Synchronisation inter-appareils réussie pour l'utilisateur", userId);
      }
    } catch (error) {
      console.warn("Erreur non critique lors de la synchronisation inter-appareils:", error);
      // Ne pas modifier allSuccess car cette étape est optionnelle
    }
    
    return allSuccess;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des tables utilisateur:", error);
    return false;
  }
};

// Fonction pour initialiser une table spécifique
async function initializeTable(tableName: string, userId: string): Promise<boolean> {
  try {
    const API_URL = getApiUrl();
    const tableInitUrl = `${API_URL}/${tableName}-sync.php`;
    
    // Créer une structure de données vide pour initialiser la table spécifique à l'utilisateur
    const emptyData = {
      userId,
      [tableName]: []
    };
    
    const response = await fetch(tableInitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...getAuthHeaders() // Inclure l'authentification pour restreindre l'accès
      },
      body: JSON.stringify(emptyData)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error(`Erreur lors de l'initialisation de la table ${tableName}:`, error);
    return false;
  }
}

// Fonction pour vérifier si un utilisateur a ses tables initialisées
export const checkUserTablesInitialized = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const checkUrl = `${API_URL}/check-tables.php?userId=${encodeURIComponent(userId)}`;
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache',
        ...getAuthHeaders() // Ajout de l'authentification pour sécuriser l'accès
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.initialized === true;
  } catch (error) {
    console.error("Erreur lors de la vérification des tables:", error);
    return false;
  }
};
