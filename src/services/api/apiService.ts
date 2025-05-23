
/**
 * Service API centralisé
 * Gère toutes les requêtes vers le serveur de manière unifiée
 */

import { getApiUrl, getAuthHeaders } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Types d'API disponibles
export type ApiEndpoint = 
  | 'users'           // Gestion des utilisateurs
  | 'documents'       // Gestion des documents
  | 'exigences'       // Gestion des exigences
  | 'membres'         // Gestion des membres (ressources humaines)
  | 'tables'          // Vérification des tables
  | 'sync'            // Synchronisation générique
  | 'auth';           // Authentification

// Configuration des endpoints
const API_ENDPOINTS: Record<ApiEndpoint, string> = {
  users: 'users.php',
  documents: 'documents-sync.php',
  exigences: 'exigences-sync.php',
  membres: 'membres-sync.php',
  tables: 'users.php?action=ensure_tables',
  sync: 'robust-sync.php',
  auth: 'auth.php'
};

// Options pour les requêtes API
interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
  useCache?: boolean;
  userId?: string;
  headers?: Record<string, string>;
}

// Résultat d'un appel API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  timestamp?: string;
}

/**
 * Parse le JSON de façon sécurisée avec gestion d'erreurs détaillée
 */
async function safeParseJSON(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  // Vérifier si la réponse est du JSON
  if (!contentType || !contentType.includes('application/json')) {
    try {
      const textResponse = await response.text();
      console.error('Réponse non-JSON reçue:', textResponse.substring(0, 500));
      throw new Error(`Le serveur a renvoyé une réponse non-JSON (${response.status})`);
    } catch (error) {
      console.error('Erreur lors de la lecture de la réponse:', error);
      throw new Error(`Erreur lors de la lecture de la réponse: ${response.status}`);
    }
  }
  
  try {
    // Tentative de parse du JSON
    return await response.json();
  } catch (error) {
    let errorMessage = 'Erreur de parsing JSON';
    
    try {
      // Essayer de récupérer le texte brut en cas d'échec de parsing
      const textResponse = await response.text();
      console.error('Contenu de la réponse non parsable:', textResponse.substring(0, 500));
      errorMessage = `Erreur de parsing JSON: ${textResponse.substring(0, 100)}...`;
    } catch (secondError) {
      console.error('Échec de la récupération du texte de la réponse:', secondError);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Fonction principale pour effectuer des appels API
 */
export async function callApi<T = any>(
  endpoint: ApiEndpoint, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    params = {},
    timeout = 30000,
    useCache = false,
    userId = getCurrentUser(),
    headers = {}
  } = options;

  try {
    // Construction de l'URL
    const API_URL = getApiUrl();
    const endpointPath = API_ENDPOINTS[endpoint];
    
    if (!endpointPath) {
      throw new Error(`Endpoint non défini: ${endpoint}`);
    }
    
    // Ajouter l'userId aux paramètres
    const allParams = { ...params };
    if (userId) {
      allParams.userId = userId;
    }
    
    // Ajouter un timestamp pour éviter le cache
    if (!useCache) {
      allParams._t = Date.now().toString();
    }
    
    // Construire l'URL avec les paramètres
    let url = `${API_URL}/${endpointPath}`;
    const queryParams = new URLSearchParams();
    
    Object.entries(allParams).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
    }
    
    console.log(`API [${method}] ${endpoint}: ${url}`);
    
    // Préparation des en-têtes
    const authHeaders = getAuthHeaders();
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': useCache ? 'max-age=3600' : 'no-cache, no-store, must-revalidate',
        ...headers
      }
    };
    
    // Ajouter le body pour les méthodes non-GET
    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }
    
    // Gestion du timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;
    
    try {
      // Effectuer la requête
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      // Vérifier si la requête a réussi (status 2xx)
      if (!response.ok) {
        // Tenter de récupérer les détails de l'erreur
        try {
          const errorData = await safeParseJSON(response);
          throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      // Parser la réponse
      const data = await safeParseJSON(response);
      
      return {
        success: true,
        data,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gestion spécifique pour les erreurs de timeout
      if (fetchError.name === 'AbortError') {
        throw new Error(`La requête a expiré après ${timeout / 1000} secondes`);
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error(`Erreur API [${endpoint}]:`, error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      status: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Service utilisateurs - centralise toutes les opérations sur les utilisateurs
 */
export const userService = {
  // Récupérer tous les utilisateurs
  getAllUsers: async () => {
    try {
      const response = await callApi('users');
      if (!response.success) {
        throw new Error(response.message || 'Échec de récupération des utilisateurs');
      }
      return response.data?.records || [];
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des utilisateurs",
        variant: "destructive",
      });
      throw error;
    }
  },
  
  // Connexion en tant qu'utilisateur
  connectAsUser: async (identifiantTechnique: string) => {
    try {
      const response = await callApi('users', { 
        method: 'POST',
        body: { 
          action: 'connect_as',
          identifiantTechnique
        }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de connexion');
      }
      
      // Mettre à jour le localStorage
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      localStorage.setItem('userPrefix', identifiantTechnique.replace(/[^a-zA-Z0-9]/g, '_'));
      
      return true;
    } catch (error) {
      console.error('Erreur connectAsUser:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    }
  },
  
  // Supprimer un utilisateur
  deleteUser: async (userId: string) => {
    try {
      const response = await callApi('users', { 
        method: 'DELETE',
        body: { id: userId }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de suppression');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      toast({
        title: "Erreur de suppression",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    }
  },
  
  // Vérifier les tables d'un utilisateur
  verifyUserTables: async (userId: string) => {
    try {
      const response = await callApi('tables', { 
        params: { userId, action: 'create_tables_for_user' }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de vérification des tables');
      }
      
      return response.data?.tables_created || [];
    } catch (error) {
      console.error('Erreur verifyUserTables:', error);
      toast({
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return [];
    }
  },
  
  // Vérifier toutes les tables utilisateurs
  verifyAllUserTables: async () => {
    try {
      const response = await callApi('tables', { 
        params: { action: 'ensure_tables' }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de vérification des tables');
      }
      
      return response.data?.results || [];
    } catch (error) {
      console.error('Erreur verifyAllUserTables:', error);
      toast({
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return [];
    }
  }
};

/**
 * Service documents - centralise toutes les opérations sur les documents
 */
export const documentService = {
  // Récupérer tous les documents
  getAllDocuments: async (userId?: string) => {
    try {
      const response = await callApi('documents', { 
        params: { action: 'get' }, 
        userId 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de récupération des documents');
      }
      
      return response.data?.documents || [];
    } catch (error) {
      console.error('Erreur getAllDocuments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les documents",
        variant: "destructive",
      });
      return [];
    }
  },
  
  // Synchroniser les documents
  syncDocuments: async (documents: any[], userId?: string) => {
    try {
      // Normalisation des documents
      const normalizedDocs = documents.map(doc => ({
        id: doc.id,
        nom: doc.nom || doc.name || '', 
        fichier_path: doc.fichier_path || null,
        responsabilites: doc.responsabilites || null,
        etat: doc.etat || doc.statut || null,
        groupId: doc.groupId || null,
        excluded: doc.excluded || false
      }));
      
      // Récupérer le préfixe utilisateur
      const userPrefix = localStorage.getItem('userPrefix') || 'u1';
      
      const response = await callApi('documents', {
        method: 'POST',
        body: {
          documents: normalizedDocs,
          userPrefix
        },
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de synchronisation des documents');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur syncDocuments:', error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    }
  }
};

/**
 * Service exigences - centralise toutes les opérations sur les exigences
 */
export const exigenceService = {
  // Récupérer toutes les exigences
  getAllExigences: async (userId?: string) => {
    try {
      const response = await callApi('exigences', { 
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de récupération des exigences');
      }
      
      return response.data?.exigences || [];
    } catch (error) {
      console.error('Erreur getAllExigences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les exigences",
        variant: "destructive",
      });
      return [];
    }
  },
  
  // Synchroniser les exigences
  syncExigences: async (exigences: any[], userId?: string) => {
    try {
      // Normaliser les données des exigences
      const normalizedExigences = exigences.map(exigence => ({
        id: exigence.id,
        nom: exigence.nom || '',
        responsabilites: exigence.responsabilites || null,
        exclusion: exigence.exclusion || false,
        atteinte: exigence.atteinte || null,
        groupId: exigence.groupId || null
      }));
      
      const response = await callApi('exigences', {
        method: 'POST',
        body: {
          exigences: normalizedExigences,
          timestamp: new Date().toISOString()
        },
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de synchronisation des exigences');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur syncExigences:', error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    }
  }
};

/**
 * Service membres - centralise toutes les opérations sur les membres (RH)
 */
export const membreService = {
  // Récupérer tous les membres
  getAllMembres: async (userId?: string) => {
    try {
      const response = await callApi('membres', { 
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de récupération des membres');
      }
      
      return response.data?.membres || [];
    } catch (error) {
      console.error('Erreur getAllMembres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les membres",
        variant: "destructive",
      });
      return [];
    }
  },
  
  // Synchroniser les membres
  syncMembres: async (membres: any[], userId?: string) => {
    try {
      const response = await callApi('membres', {
        method: 'POST',
        body: {
          membres,
          timestamp: new Date().toISOString()
        },
        userId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de synchronisation des membres');
      }
      
      return true;
    } catch (error) {
      console.error('Erreur syncMembres:', error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    }
  }
};

/**
 * Service d'authentification - centralise toutes les opérations d'authentification
 */
export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await callApi('auth', {
        method: 'POST',
        body: { email, password }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de connexion');
      }
      
      // Stockage du token, etc.
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      if (response.data?.utilisateur) {
        localStorage.setItem('currentUser', JSON.stringify(response.data.utilisateur));
        localStorage.setItem('userRole', response.data.utilisateur.role);
        localStorage.setItem('currentDatabaseUser', response.data.utilisateur.identifiant_technique);
      }
      
      return response.data?.utilisateur;
    } catch (error) {
      console.error('Erreur login:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return null;
    }
  },
  
  logout: () => {
    // Suppression des données de session
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentDatabaseUser');
  }
};
