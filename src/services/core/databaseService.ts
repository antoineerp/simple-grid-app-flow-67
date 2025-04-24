
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { DatabaseInfo } from '@/hooks/useAdminDatabase';

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    console.log('Récupération des informations de la base de données...');
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/database-test`, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    // Vérification de la réponse HTTP
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status}`);
      const errorText = await response.text();
      console.error(`Contenu de l'erreur: ${errorText.substring(0, 500)}`);
      throw new Error(`Erreur lors de la récupération des informations de la base de données: ${response.status}`);
    }
    
    // Vérifier si le contenu est vide
    const responseText = await response.text();
    if (!responseText.trim()) {
      console.error("Réponse vide reçue du serveur");
      throw new Error("Réponse vide du serveur");
    }
    
    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Contenu reçu:", responseText.substring(0, 200));
      throw new Error(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : 'Format invalide'}`);
    }
    
    console.log('Données reçues:', data);
    
    if (data.status === 'success') {
      return {
        host: data.info.host || 'Non disponible',
        database: data.info.database_name || 'Non disponible',
        size: data.info.size || '0 MB',
        tables: data.info.table_count || 0,
        lastBackup: 'Non disponible', // Peut être ajouté au backend ultérieurement
        status: data.info.connection_status || 'Online',
        encoding: data.info.encoding,
        collation: data.info.collation,
        tableList: data.info.tables
      };
    } else if (data.status === 'warning') {
      return {
        host: data.info?.host || 'Non disponible',
        database: data.info?.database_name || 'Non disponible',
        size: '0 MB',
        tables: 0,
        lastBackup: 'Non disponible',
        status: 'Warning',
        encoding: 'Non disponible',
        collation: 'Non disponible'
      };
    } else {
      console.error('Échec de la récupération des informations de la base de données:', data.message || 'Raison inconnue');
      throw new Error(data.message || data.error || 'Échec de la récupération des informations de la base de données');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    throw error;
  }
};

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Test de connexion à la base de données...');
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/database-test`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    
    // En cas d'erreur HTTP, essayer de lire la réponse d'abord
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error(`Erreur HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        
        // Essayer de parser en JSON si possible
        if (errorText && errorText.trim().startsWith('{')) {
          const errorJson = JSON.parse(errorText);
          console.error('Détails de l\'erreur:', errorJson);
        }
      } catch (readError) {
        console.error('Impossible de lire la réponse d\'erreur:', readError);
      }
      return false;
    }
    
    // Vérifier si le contenu est vide
    const responseText = await response.text();
    if (!responseText.trim()) {
      console.error("Réponse vide reçue du serveur");
      return false;
    }
    
    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Contenu reçu:", responseText.substring(0, 200));
      return false;
    }
    
    console.log('Résultat du test de connexion:', data);
    
    // La connexion est réussie si le statut de la réponse est "success"
    return data.status === 'success';
  } catch (error) {
    console.error('Erreur lors du test de connexion à la base de données:', error);
    return false;
  }
};
