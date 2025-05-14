
/**
 * Utilitaires pour valider et nettoyer les réponses JSON du serveur
 * Ces fonctions sont particulièrement utiles pour gérer les cas où 
 * le serveur retourne du HTML au lieu de JSON (erreur PHP/Apache)
 */

interface JsonValidationResult<T = any> {
  isValid: boolean;
  data: T | null;
  error: string | null;
  htmlDetected: boolean;
}

/**
 * Tente d'extraire du JSON valide à partir d'une réponse potentiellement corrompue
 * @param responseText - Le texte de la réponse à analyser
 * @returns Un objet indiquant si une extraction a réussi et les données extraites
 */
export const extractValidJson = <T = any>(responseText: string): { extracted: boolean; data: T | null } => {
  try {
    // Essayer de trouver du JSON dans la réponse
    const jsonMatch = responseText.match(/(\{.*\}|\[.*\])/s);
    if (jsonMatch && jsonMatch[0]) {
      const possibleJson = jsonMatch[0];
      try {
        const parsedData = JSON.parse(possibleJson) as T;
        return { extracted: true, data: parsedData };
      } catch {
        // Si le JSON extrait n'est pas valide, retourner échec
        return { extracted: false, data: null };
      }
    }
    return { extracted: false, data: null };
  } catch (error) {
    console.error("Erreur lors de la tentative d'extraction JSON:", error);
    return { extracted: false, data: null };
  }
};

/**
 * Valide et analyse une réponse JSON
 * @param responseText - Le texte de la réponse à analyser
 * @returns Un objet contenant le statut de validation, les données et l'erreur éventuelle
 */
export const validateJsonResponse = <T = any>(responseText: string): JsonValidationResult<T> => {
  // Vérifier si la réponse est vide
  if (!responseText || responseText.trim() === '') {
    return {
      isValid: false,
      data: null,
      error: 'La réponse du serveur est vide',
      htmlDetected: false
    };
  }
  
  // Vérifier si la réponse contient du HTML
  const hasHtmlTag = /<(!DOCTYPE|html|head|body|div|script)/i.test(responseText);
  
  if (hasHtmlTag) {
    const htmlTitle = responseText.match(/<title>(.*?)<\/title>/i);
    const errorMessage = htmlTitle 
      ? `Le serveur a retourné une page HTML au lieu de JSON: ${htmlTitle[1]}` 
      : 'Le serveur a retourné une page HTML au lieu de JSON';
      
    return {
      isValid: false,
      data: null,
      error: errorMessage,
      htmlDetected: true
    };
  }
  
  // Essayer de parser le JSON
  try {
    const parsedData = JSON.parse(responseText) as T;
    return {
      isValid: true,
      data: parsedData,
      error: null,
      htmlDetected: false
    };
  } catch (error) {
    return {
      isValid: false,
      data: null,
      error: `Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      htmlDetected: false
    };
  }
};

/**
 * Analyse en toute sécurité une réponse du serveur, en gérant le cas où
 * le serveur renvoie du HTML au lieu de JSON
 * @param response - La réponse fetch à analyser
 * @returns Les données JSON ou lance une erreur avec un message clair
 */
export const safeParseJsonResponse = async <T = any>(response: Response): Promise<T> => {
  const responseText = await response.text();
  const result = validateJsonResponse<T>(responseText);
  
  if (!result.isValid) {
    const detailedError = new Error(result.error || 'Erreur lors du parsing de la réponse');
    if (result.htmlDetected) {
      // Ajouter des informations supplémentaires sur l'erreur HTML
      (detailedError as any).htmlResponse = responseText.substring(0, 500);
      (detailedError as any).htmlDetected = true;
      console.error('Le serveur a retourné du HTML au lieu de JSON:', responseText.substring(0, 500));
    }
    
    throw detailedError;
  }
  
  return result.data as T;
};

/**
 * Modifie une fonction fetch pour automatiquement valider et nettoyer les réponses JSON
 * @param fetchFunction - La fonction fetch à modifier
 * @returns Une fonction fetch qui gère automatiquement les erreurs de parsing JSON
 */
export const createSafeFetch = (fetchFunction = fetch) => {
  return async <T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
    const response = await fetchFunction(input, init);
    
    if (!response.ok) {
      try {
        // Essayer de parser le corps de l'erreur comme JSON
        const errorText = await response.text();
        const errorResult = validateJsonResponse(errorText);
        
        if (errorResult.isValid && errorResult.data) {
          throw new Error(
            (errorResult.data as any).message || 
            (errorResult.data as any).error || 
            `Erreur HTTP: ${response.status}`
          );
        } else if (errorResult.htmlDetected) {
          throw new Error(`Le serveur a retourné une page HTML au lieu de JSON (${response.status})`);
        } else {
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }
      } catch (parseError) {
        // Si l'erreur ne peut pas être parsée comme JSON, lancer une erreur HTTP standard
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
    }
    
    return safeParseJsonResponse<T>(response);
  };
};

// Exemple d'utilisation: const safeFetch = createSafeFetch();
