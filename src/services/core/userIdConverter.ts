
// Fichier utilitaire pour la conversion entre email et identifiant technique

// Mapping d'emails vers des identifiants techniques
const EMAIL_TO_ID_MAPPING: Record<string, string> = {
  'antcirier@gmail.com': 'p71x6d_cirier',
  'admin@example.com': 'p71x6d_system'
};

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
  
  // Vérifier si l'email est dans le mapping
  if (EMAIL_TO_ID_MAPPING[input]) {
    console.log(`Conversion de l'email ${input} vers l'identifiant technique ${EMAIL_TO_ID_MAPPING[input]}`);
    return EMAIL_TO_ID_MAPPING[input];
  }
  
  // Pour un nouvel email, générer un identifiant technique basé sur le nom d'utilisateur
  const username = input.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const technicalId = `p71x6d_${username}`;
  
  console.log(`Création d'identifiant technique ${technicalId} pour l'email ${input}`);
  
  // Ajouter au mapping pour utilisation future
  // Note: Ceci est temporaire pour cette session, le mapping sera perdu au rechargement
  (EMAIL_TO_ID_MAPPING as any)[input] = technicalId;
  
  return technicalId;
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
      return convertEmailToTechnicalId(input);
    }
    return input;
  }
  
  // Si c'est un objet, essayer de récupérer l'identifiant
  if (typeof input === 'object') {
    if (input.identifiant_technique) {
      return input.identifiant_technique;
    }
    if (input.email) {
      return convertEmailToTechnicalId(input.email);
    }
    if (input.user_id) {
      return input.user_id;
    }
  }
  
  // Par défaut
  return 'p71x6d_richard';
};
