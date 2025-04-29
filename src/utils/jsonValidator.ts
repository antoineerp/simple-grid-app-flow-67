
/**
 * Utilitaire pour valider et analyser les réponses JSON
 */
export const validateJsonResponse = (text: string): { isValid: boolean; data?: any; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Réponse vide ou invalide' };
  }
  
  // Vérifier si la réponse est du HTML au lieu de JSON
  if (text.trim().toLowerCase().startsWith('<!doctype') || 
      text.trim().toLowerCase().startsWith('<html') ||
      text.includes('<?php') ||
      text.includes('<br />') ||
      text.includes('<b>') ||
      text.includes('</b>')) {
    console.error("Réponse HTML détectée au lieu de JSON:", text.substring(0, 300));
    return { 
      isValid: false, 
      error: 'La réponse est du HTML au lieu de JSON (erreur PHP probable)',
      data: text.substring(0, 200) + '...'
    };
  }
  
  try {
    const data = JSON.parse(text);
    return { isValid: true, data };
  } catch (e) {
    console.error('Erreur de parsing JSON:', e);
    
    // Recherche de caractères non-valides dans le JSON
    let errorDetails = 'Format JSON invalide';
    
    if (text.length > 0) {
      // Recherche des séquences qui pourraient causer des erreurs JSON
      const suspectPatterns = [
        { pattern: /\n\s*echo/g, message: 'Contient des commandes PHP "echo" qui interfèrent avec le JSON' },
        { pattern: /\<\?php/g, message: 'Contient des balises PHP qui interfèrent avec le JSON' },
        { pattern: /\?>/g, message: 'Contient des balises PHP de fermeture' },
        { pattern: /^\s*[a-zA-Z]/g, message: 'Commence par du texte au lieu de { ou [' },
        { pattern: /\<br\s*\/?\>/g, message: 'Contient des balises HTML <br>' },
        { pattern: /\<\/?[a-zA-Z][^>]*>/g, message: 'Contient des balises HTML' }
      ];
      
      for (const { pattern, message } of suspectPatterns) {
        if (pattern.test(text)) {
          errorDetails = message;
          break;
        }
      }
      
      // Ajouter un extrait de la réponse pour faciliter le diagnostic
      errorDetails += `\nDébut de la réponse: ${text.substring(0, 100)}...`;
    }
    
    return { isValid: false, error: errorDetails };
  }
};

/**
 * Normalise une réponse qui pourrait contenir du texte avant ou après le JSON valide
 * Tente d'extraire une partie JSON valide d'une réponse potentiellement corrompue
 */
export const extractValidJson = (text: string): { extracted: boolean; data?: any; error?: string } => {
  // Si la réponse est clairement du HTML, ne pas essayer d'extraire du JSON
  if (text.includes('<!DOCTYPE') || 
      text.includes('<html') ||
      (text.includes('<br') && text.includes('</b>'))) {
    console.error("Réponse HTML détectée, pas de tentative d'extraction de JSON");
    return { 
      extracted: false, 
      error: 'La réponse est du HTML (probablement une erreur PHP). Vérifiez les logs du serveur.'
    };
  }
  
  try {
    // Essayer d'abord de nettoyer la chaîne des balises HTML simples
    let cleanedText = text;
    if (text.includes('<br />') || text.includes('<b>')) {
      cleanedText = text.replace(/<br\s*\/?>/g, ' ')
                        .replace(/<\/?[a-z][^>]*>/gi, '');
      console.log("Texte nettoyé des balises HTML:", cleanedText.substring(0, 100));
    }
    
    // Essayer de trouver un JSON valide dans la chaîne
    const jsonStartIndex = cleanedText.indexOf('{');
    const jsonEndIndex = cleanedText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      // Essayer avec des crochets pour un tableau
      const arrayStartIndex = cleanedText.indexOf('[');
      const arrayEndIndex = cleanedText.lastIndexOf(']') + 1;
      
      if (arrayStartIndex === -1 || arrayEndIndex === 0) {
        return { extracted: false, error: 'Impossible de trouver une structure JSON valide' };
      }
      
      const possibleJson = cleanedText.substring(arrayStartIndex, arrayEndIndex);
      console.log("JSON potentiel extrait (tableau):", possibleJson.substring(0, 100));
      const data = JSON.parse(possibleJson);
      return { extracted: true, data };
    }
    
    const possibleJson = cleanedText.substring(jsonStartIndex, jsonEndIndex);
    console.log("JSON potentiel extrait (objet):", possibleJson.substring(0, 100));
    const data = JSON.parse(possibleJson);
    return { extracted: true, data };
    
  } catch (e) {
    console.error("Échec de l'extraction de JSON:", e);
    return { extracted: false, error: 'Échec de l\'extraction de JSON valide' };
  }
};

/**
 * Fonction utilitaire pour analyser une réponse fetch et extraire le JSON
 * avec gestion robuste des erreurs
 */
export const parseFetchResponse = async (response: Response): Promise<any> => {
  try {
    // Vérifier d'abord si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    // Récupérer le texte de la réponse
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      console.warn("Réponse vide reçue du serveur");
      return null;
    }
    
    // Vérifier si la réponse est du JSON valide
    const { isValid, data, error } = validateJsonResponse(text);
    if (isValid) {
      return data;
    }
    
    // Essayer d'extraire du JSON valide
    console.warn("Réponse non valide, tentative d'extraction de JSON:", error);
    const { extracted, data: extractedData, error: extractError } = extractValidJson(text);
    
    if (extracted) {
      console.log("JSON extrait avec succès d'une réponse partiellement corrompue");
      return extractedData;
    }
    
    // Si l'extraction échoue, lever une erreur
    console.error("Échec de l'analyse de la réponse:", text.substring(0, 300));
    throw new Error(`Réponse non-JSON: ${extractError || error || 'Format invalide'}`);
  } catch (e) {
    console.error("Erreur lors du traitement de la réponse:", e);
    throw e;
  }
};
