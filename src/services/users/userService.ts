
// Ce fichier est conservé pour la compatibilité avec le code existant
// mais délègue maintenant ses fonctionnalités au nouveau UserManager
import { getUtilisateurs as getUsersFromManager } from './userManager';
import { Utilisateur } from '@/types/user';

// Export des fonctions simplifiées qui utilisent le UserManager
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  console.log("userService.getUtilisateurs appelé - déléguant à UserManager");
  return getUsersFromManager();
};
