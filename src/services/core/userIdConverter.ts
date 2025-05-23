
// Fichier utilitaire pour la conversion entre email et identifiant technique

/**
 * Vérifie si l'entrée est une adresse email
 */
export const isEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/**
 * Convertit un email en identifiant technique si possible
 * @param email - L'email à convertir ou l'identifiant à vérifier
 * @returns L'identifiant technique correspondant
 */
export const convertEmailToTechnicalId = (input: string): string => {
  // Si ce n'est pas un email, retourner tel quel
  if (!isEmail(input)) {
    return input;
  }
  
  // Pour un email, utiliser directement l'email comme identifiant technique
  console.log(`Utilisation directe de l'email ${input} comme identifiant technique`);
  return input;
};

/**
 * Récupère l'identifiant technique correct à partir de diverses entrées possibles
 * @param input - L'email, identifiant ou objet utilisateur
 * @returns L'identifiant technique
 */
export const ensureCorrectUserId = (input: string | any): string => {
  // Si null ou undefined, retourner l'identifiant par défaut
  if (!input) {
    return 'p71x6d_richard';
  }
  
  // Si c'est une chaîne
  if (typeof input === 'string') {
    // Si c'est un email
    if (isEmail(input)) {
      return input; // Utiliser directement l'email
    }
    return input;
  }
  
  // Si c'est un objet, essayer de récupérer l'identifiant
  if (typeof input === 'object') {
    if (input.identifiant_technique) {
      return input.identifiant_technique;
    }
    if (input.email) {
      return input.email;
    }
    if (input.user_id) {
      return input.user_id;
    }
  }
  
  // Par défaut
  return 'p71x6d_richard';
};
