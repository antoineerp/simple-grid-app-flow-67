
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/auth/authService';
import { validateJsonResponse, extractValidJson } from '@/utils/jsonValidator';

interface SyncOptions {
  retryCount?: number;
  validate?: boolean;
  silent?: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Vérifie si le point de terminaison renvoie du JSON valide
 * Cette fonction est importante pour éviter les erreurs "Unexpected token <"
 */
export const verifyJsonEndpoint = async (): Promise<boolean> => {
  try {
    // Utiliser un paramètre aléatoire pour éviter la mise en cache
    const cacheBreaker = `?nocache=${Date.now()}`;
    const response = await fetch(`${getApiUrl()}/verify-json-endpoint.php${cacheBreaker}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });

    // Si la réponse n'est pas OK (ex. 404, 500), retourner false
    if (!response.ok) {
      console.error(`verifyJsonEndpoint: Erreur HTTP ${response.status}`);
      return false;
    }

    // Lire le texte de la réponse pour valider qu'il s'agit de JSON
    const text = await response.text();
    const validation = validateJsonResponse(text);
    
    if (validation.isValid) {
      console.log("Le point de terminaison JSON est valide");
      return true;
    } else {
      console.error("Le point de terminaison a répondu, mais pas avec du JSON valide:", validation.error);
      console.error("Début de la réponse:", text.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du point de terminaison JSON:", error);
    return false;
  }
};

/**
 * Effectue une synchronisation avec un mécanisme de nouvelle tentative et validation
 */
const syncData = async <T>(type: string, data: T[], options: SyncOptions = {}): Promise<SyncResult> => {
  const { retryCount = 1, validate = true, silent = false } = options;
  const userId = getCurrentUser() || 'default';
  const endpoint = `${getApiUrl()}/${type}-sync.php`;
  
  console.log(`Synchronisation ${type} pour l'utilisateur ${userId}, ${data.length} éléments, ${retryCount} tentatives`);

  // Vérifier d'abord si le point de terminaison est valide
  if (validate) {
    const isValid = await verifyJsonEndpoint();
    if (!isValid) {
      console.error(`Le point de terminaison pour ${type} n'est pas valide`);
      return {
        success: false,
        message: "Le serveur ne répond pas correctement. Les données sont conservées localement uniquement."
      };
    }
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${retryCount} pour ${type}`);
      
      // Préparer les données pour la synchronisation
      const payload = {
        userId,
        [type]: data
      };
      
      // Effectuer la requête avec un timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Vérifier les erreurs HTTP
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Récupérer et valider le contenu
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error("Réponse vide du serveur");
      }
      
      // Valider que la réponse est du JSON (pour éviter les erreurs "Unexpected token <")
      const validation = validateJsonResponse(text);
      
      if (validation.isValid) {
        const responseData = validation.data;
        
        if (responseData.success === true) {
          console.log(`Synchronisation ${type} réussie:`, responseData.message || "Opération réussie");
          return {
            success: true,
            message: responseData.message || "Synchronisation réussie",
            data: responseData
          };
        } else {
          throw new Error(responseData.message || "Le serveur a signalé une erreur");
        }
      } else {
        // Si la validation échoue, essayer d'extraire du JSON valide
        console.warn("La réponse n'est pas du JSON valide, tentative d'extraction...");
        const extraction = extractValidJson(text);
        
        if (extraction.extracted) {
          console.log("JSON valide extrait de la réponse");
          
          if (extraction.data && extraction.data.success === true) {
            return {
              success: true,
              message: "Synchronisation réussie (données extraites)",
              data: extraction.data
            };
          } else {
            throw new Error("Les données extraites indiquent une erreur");
          }
        } else {
          throw new Error(validation.error || "Réponse invalide du serveur");
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Erreur lors de la tentative ${attempt}/${retryCount}:`, lastError.message);
      
      // Si ce n'est pas la dernière tentative, attendre avant de réessayer
      if (attempt < retryCount) {
        const delay = Math.min(1000 * attempt, 3000); // Délai exponentiel mais plafonné à 3 secondes
        console.log(`Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  const errorMessage = lastError ? lastError.message : "Échec de la synchronisation après plusieurs tentatives";
  console.error(`Synchronisation ${type} échouée après ${retryCount} tentatives:`, errorMessage);
  
  return {
    success: false,
    message: errorMessage
  };
};

const robustSync = {
  syncData,
  verifyJsonEndpoint
};

export default robustSync;
