
import { getApiUrl } from '@/config/apiConfig';
import { DatabaseInfo } from '@/hooks/useAdminDatabase';

// Obtenir l'URL de l'API
const API_URL = getApiUrl();

// Test de la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Test de la connexion à la base de données...");
    console.log("URL API pour le test de connexion:", `${API_URL}/db-connection-test.php`);
    
    const response = await fetch(`${API_URL}/db-connection-test.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log("Statut de la réponse du test de connexion:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Réponse du test de connexion:", data);
    
    // Retourner true seulement si le statut est success
    return data.status === 'success';
  } catch (err) {
    console.error("Erreur lors du test de connexion à la base de données:", err);
    return false;
  }
};

// Récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    console.log("Récupération des informations sur la base de données...");
    // Utiliser le nouveau endpoint db-info à la place de database-diagnostic
    console.log("URL API pour les informations de la base de données:", `${API_URL}/db-info`);
    
    const response = await fetch(`${API_URL}/db-info`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log("Statut de la réponse des informations DB:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Réponse d'erreur lors de la récupération des informations:", response.status, "\n", errorText);
      throw new Error(`Impossible de récupérer les informations de la base de données (${response.status})`);
    }
    
    const data = await response.json();
    console.log("Informations de la base de données reçues:", data);
    
    if (data.status === 'success' && data.database_info) {
      return {
        host: data.database_info.host,
        database: data.database_info.database,
        size: data.database_info.size,
        tables: data.database_info.tables,
        lastBackup: data.database_info.lastBackup,
        status: data.database_info.status,
        encoding: data.database_info.encoding,
        collation: data.database_info.collation,
        tableList: data.database_info.tableList
      };
    } else {
      throw new Error(data.message || 'Erreur lors de la récupération des informations');
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de la base de données:", err);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      host: 'Non connecté',
      database: 'Non connecté',
      size: 'N/A',
      tables: 0,
      lastBackup: 'N/A',
      status: 'Offline'
    };
  }
};

// Obtenir le nom de l'utilisateur actuellement connecté à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  // Dans un environnement réel, cette information proviendrait d'une requête API
  // Pour l'instant, nous utilisons une valeur codée en dur
  return localStorage.getItem('database_user') || "p71x6d_system";
};
