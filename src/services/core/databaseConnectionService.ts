
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';
import { initializeUserTables } from './userInitializationService';

// Clés de stockage local
const CURRENT_USER_KEY = 'db_current_user';
const LAST_ERROR_KEY = 'db_last_error';

// État global
let isConnected = false;
let lastConnectionError: string | null = null;
let dbInfo: any = null;

/**
 * Récupère l'utilisateur actuellement connecté à la base de données
 */
export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Récupère la dernière erreur de connexion
 */
export function getLastConnectionError(): string | null {
  return lastConnectionError;
}

/**
 * Se connecte en tant qu'utilisateur spécifique
 */
export async function connectAsUser(userId: string): Promise<boolean> {
  try {
    console.log(`Tentative de connexion en tant que ${userId}`);
    
    // Vérifier le format de l'identifiant utilisateur
    if (!userId || typeof userId !== 'string' || !userId.startsWith('p71x6d_')) {
      throw new Error(`Format d'identifiant invalide: ${userId}`);
    }
    
    // Initialiser les tables utilisateur si nécessaire
    await initializeUserTables(userId);
    
    // Enregistrer l'utilisateur courant
    localStorage.setItem(CURRENT_USER_KEY, userId);
    localStorage.removeItem(LAST_ERROR_KEY);
    
    isConnected = true;
    lastConnectionError = null;
    
    console.log(`Connexion réussie en tant que ${userId}`);
    return true;
    
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue";
    localStorage.setItem(LAST_ERROR_KEY, lastConnectionError);
    
    isConnected = false;
    
    return false;
  }
}

/**
 * Déconnecte l'utilisateur actuel
 */
export function disconnectUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  isConnected = false;
  console.log("Utilisateur déconnecté de la base de données");
}

/**
 * Teste la connexion à la base de données
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/db-test.php`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.connected) {
      throw new Error(result.message || "Échec de la connexion à la base de données");
    }
    
    console.log("Test de connexion à la base de données réussi");
    return true;
    
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: error instanceof Error ? error.message : "Erreur inconnue"
    });
    
    return false;
  }
}

/**
 * Récupère les informations sur la base de données
 */
export async function getDatabaseInfo(): Promise<any> {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/db-info.php`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    dbInfo = result;
    
    return result;
    
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    return null;
  }
}
