
/**
 * Détecte si le contenu de la réponse est du code PHP et non du JSON
 */
export const isPhpContent = (text: string): boolean => {
  return text.trim().startsWith('<?php') || text.includes('<?php');
};

/**
 * Vérifie si la réponse du serveur est valide
 */
export const validateApiResponse = async (response: Response): Promise<any> => {
  const responseText = await response.text();
  
  if (isPhpContent(responseText)) {
    console.error('❌ ERREUR - Le serveur a retourné du code PHP au lieu de JSON:', responseText.substring(0, 200));
    throw new Error('Configuration serveur incorrecte: PHP n\'est pas exécuté correctement');
  }
  
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('❌ ERREUR - Réponse non JSON:', responseText);
    throw new Error(`Réponse invalide du serveur: Impossible de parser le JSON`);
  }
};
