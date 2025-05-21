
import { getCurrentUser } from './databaseConnectionService';
import { getApiUrl, getAuthHeaders } from '@/config/apiConfig';
import { toast } from '@/components/ui/use-toast';

/**
 * Service intercepteur pour garantir que toutes les requêtes API incluent l'ID utilisateur
 */

// Fonction pour récupérer l'URL API avec l'ID utilisateur
export const getApiUrlWithUserId = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  const userId = getCurrentUser();
  
  if (!userId) {
    console.error("Erreur critique: Tentative de requête API sans ID utilisateur");
    toast({
      title: "Erreur de sécurité",
      description: "Impossible d'effectuer l'opération: identifiant utilisateur manquant",
      variant: "destructive"
    });
    throw new Error("ID utilisateur requis pour toutes les requêtes API");
  }

  // Si l'endpoint contient déjà un point d'interrogation (paramètres existants)
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${baseUrl}/${endpoint}${separator}userId=${encodeURIComponent(userId)}`;
};

// Fonction pour effectuer une requête GET sécurisée
export const secureGet = async <T>(endpoint: string): Promise<T> => {
  const url = getApiUrlWithUserId(endpoint);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erreur API (${response.status}): ${errorText}`);
    throw new Error(`Erreur lors de la requête: ${response.status}`);
  }
  
  return await response.json();
};

// Fonction pour effectuer une requête POST sécurisée
export const securePost = async <T>(endpoint: string, data: any): Promise<T> => {
  const url = getApiUrlWithUserId(endpoint);
  const userId = getCurrentUser();
  
  // S'assurer que l'ID utilisateur est inclus dans les données
  const secureData = {
    ...data,
    userId: userId // Toujours forcer l'ID utilisateur dans le corps de la requête
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(secureData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erreur API POST (${response.status}): ${errorText}`);
    throw new Error(`Erreur lors de la requête POST: ${response.status}`);
  }
  
  return await response.json();
};

// Fonction pour valider la présence d'un userId
export const validateUserId = (): string => {
  const userId = getCurrentUser();
  
  if (!userId) {
    console.error("Erreur critique: ID utilisateur manquant");
    toast({
      title: "Erreur d'authentification",
      description: "Vous devez être connecté pour effectuer cette action",
      variant: "destructive"
    });
    throw new Error("ID utilisateur requis");
  }
  
  return userId;
};
