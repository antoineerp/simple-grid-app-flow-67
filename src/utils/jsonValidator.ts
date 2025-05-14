
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
      text.includes('<?php')) {
    return { 
      isValid: false, 
      error: 'La réponse est du HTML ou du PHP au lieu de JSON',
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
        { pattern: /^\s*[a-zA-Z]/g, message: 'Commence par du texte au lieu de { ou [' }
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
  try {
    // Essayer de trouver un JSON valide dans la chaîne
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      // Essayer avec des crochets pour un tableau
      const arrayStartIndex = text.indexOf('[');
      const arrayEndIndex = text.lastIndexOf(']') + 1;
      
      if (arrayStartIndex === -1 || arrayEndIndex === 0) {
        return { extracted: false, error: 'Impossible de trouver une structure JSON valide' };
      }
      
      const possibleJson = text.substring(arrayStartIndex, arrayEndIndex);
      const data = JSON.parse(possibleJson);
      return { extracted: true, data };
    }
    
    const possibleJson = text.substring(jsonStartIndex, jsonEndIndex);
    const data = JSON.parse(possibleJson);
    return { extracted: true, data };
    
  } catch (e) {
    return { extracted: false, error: 'Échec de l\'extraction de JSON valide' };
  }
};
