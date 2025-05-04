
/**
 * Utilitaires pour valider et nettoyer les réponses JSON du serveur
 * Ces fonctions sont particulièrement utiles pour gérer les cas où 
 * le serveur retourne du HTML au lieu de JSON (erreur PHP/Apache)
 */

interface JsonValidationResult<T = any> {
  isValid: boolean;
  data: T | null;
  error: string | null;
}

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
      error: 'La réponse du serveur est vide'
    };
  }
  
  // Vérifier si la réponse contient du HTML (probablement une page d'erreur)
  if (responseText.includes('<html') || responseText.includes('<!DOCTYPE') || responseText.includes('<br') || responseText.includes('<body')) {
    return {
      isValid: false,
      data: null,
      error: 'La réponse du serveur contient du HTML au lieu de JSON'
    };
  }
  
  try {
    // Tenter d'analyser la réponse comme JSON
    const data = JSON.parse(responseText) as T;
    return {
      isValid: true,
      data,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      data: null,
      error: `Impossible d'analyser la réponse JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Tente d'extraire une partie JSON valide d'une réponse corrompue
 * Utile pour les cas où le serveur renvoie du JSON valide entouré d'autres caractères
 */
export const extractValidJson = <T = any>(text: string): { extracted: boolean; data: T | null } => {
  // Chercher le début et la fin d'un objet ou tableau JSON potentiel
  const jsonStart = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[');
  
  if (jsonStart === -1) {
    return { extracted: false, data: null };
  }
  
  // Chercher la fin correspondante
  const starter = text[jsonStart];
  const ender = starter === '{' ? '}' : ']';
  let nesting = 0;
  let jsonEnd = -1;
  
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === starter) nesting++;
    if (text[i] === ender) nesting--;
    if (nesting === 0) {
      jsonEnd = i;
      break;
    }
  }
  
  if (jsonEnd === -1) {
    return { extracted: false, data: null };
  }
  
  const jsonText = text.substring(jsonStart, jsonEnd + 1);
  
  try {
    return { extracted: true, data: JSON.parse(jsonText) };
  } catch (e) {
    return { extracted: false, data: null };
  }
};

/**
 * Fonction pour vérifier si une réponse est une erreur PHP ou une page d'erreur serveur
 * Utile pour diagnostiquer les problèmes de configuration du serveur
 */
export const isPhpErrorResponse = (text: string): boolean => {
  const phpErrorPatterns = [
    'Fatal error:',
    'Parse error:',
    'Warning:',
    'Notice:',
    'Deprecated:',
    '<b>PHP Error</b>',
    'Stack trace:',
    'Exception'
  ];
  
  return phpErrorPatterns.some(pattern => text.includes(pattern));
};

/**
 * Extrait les messages d'erreur PHP utiles d'une réponse HTML
 */
export const extractPhpErrorMessage = (text: string): string | null => {
  // Recherche des motifs d'erreur PHP courants
  const errorRegex = /(Fatal error|Parse error|Warning|Notice|Deprecated):\s*(.+?)\s+in\s+(.+?)\s+on\s+line\s+(\d+)/i;
  const match = text.match(errorRegex);
  
  if (match) {
    return `${match[1]}: ${match[2]} (dans ${match[3]} ligne ${match[4]})`;
  }
  
  // Si aucun motif standard n'est trouvé, essayer de trouver tout texte significatif
  if (text.includes('<body')) {
    // Extraire le contenu entre les balises body
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      // Nettoyer le HTML
      const content = bodyMatch[1]
        .replace(/<[^>]*>/g, ' ') // Supprimer les balises
        .replace(/\s+/g, ' ')     // Normaliser les espaces
        .trim();
      
      if (content) {
        return content.substring(0, 200) + (content.length > 200 ? '...' : '');
      }
    }
  }
  
  return null;
};

/**
 * Vérifie si une table existe et a la structure attendue
 * Utile pour la vérification des points mentionnés concernant la structure des tables
 */
export const verifyTableSchema = async (tableName: string, expectedColumns: string[]): Promise<boolean> => {
  // Cette fonction est un exemple de ce qui pourrait être implémenté pour vérifier
  // la structure des tables via une API côté serveur
  console.log(`Vérification de la structure de la table ${tableName}`);
  console.log(`Colonnes attendues: ${expectedColumns.join(', ')}`);
  
  // À implémenter selon les besoins spécifiques
  return true;
};
