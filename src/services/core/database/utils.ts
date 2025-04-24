
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import type { DatabaseInfo, DatabaseResponse } from './types';
import { getCurrentUser, getLastConnectionError } from './connectionService';

export const validateJsonResponse = (responseText: string): any => {
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Erreur d'analyse JSON:", e);
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error("Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez la configuration du serveur.");
    }
    
    throw new Error(`Erreur d'analyse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  toast({
    title,
    description,
    variant,
  });
};

export const getBaseUrl = () => getApiUrl();

export const formatDatabaseInfo = (data: DatabaseResponse['info']): DatabaseInfo => ({
  host: data?.host || "Hôte inconnu",
  database: data?.database_name || "Base de données inconnue",
  size: data?.size || "Taille inconnue",
  tables: data?.table_count || 0,
  lastBackup: data?.last_backup || "N/A",
  status: "Online",
  encoding: data?.encoding || "UTF-8",
  collation: data?.collation || "N/A",
  tableList: data?.tables || []
});

// Ajout des fonctions manquantes
export const connectAsUser = async (identifiant: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion à la base de données en tant que: ${identifiant}`);
    const response = await fetch(`${getBaseUrl()}/database-connect`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifiant })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la connexion (${response.status})`);
    }

    const data = await validateJsonResponse(await response.text());
    
    if (data.status === 'success') {
      showToast("Connexion réussie", `Connecté à la base de données en tant que ${identifiant}`);
      return true;
    } else {
      throw new Error(data.message || "Échec de la connexion");
    }
  } catch (error) {
    console.error("Erreur de connexion à la base de données:", error);
    showToast(
      "Erreur de connexion", 
      error instanceof Error ? error.message : "Impossible de se connecter à la base de données", 
      "destructive"
    );
    return false;
  }
};

export const disconnectUser = async (): Promise<boolean> => {
  try {
    console.log("Déconnexion de la base de données...");
    const response = await fetch(`${getBaseUrl()}/database-disconnect`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la déconnexion (${response.status})`);
    }

    const data = await validateJsonResponse(await response.text());
    
    if (data.status === 'success') {
      showToast("Déconnexion réussie", "Déconnecté de la base de données");
      return true;
    } else {
      throw new Error(data.message || "Échec de la déconnexion");
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return false;
  }
};

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Test de la connexion à la base de données...");
    const response = await fetch(`${getBaseUrl()}/database-test`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Échec du test de connexion (${response.status})`);
    }

    const data = await validateJsonResponse(await response.text());
    return data.status === 'success';
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    return false;
  }
};

export const getDatabaseConnectionCurrentUser = (): string | null => {
  return getCurrentUser();
};
