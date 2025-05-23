
// Index de tous les services de l'application
// Ce fichier centralise les exports pour faciliter les imports

// Exporter le service API principal
export * from './api/apiService';

// Réexporter les services existants
export * from './users/userService';
export * from './auth/authService';

// Exporter connectAsUser pour la compatibilité
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    const { userService } = await import('./api/apiService');
    return await userService.connectAsUser(identifiantTechnique);
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    return false;
  }
};

// Fonction pour nettoyer le cache des utilisateurs
export const clearUsersCache = (): void => {
  localStorage.removeItem('usersCache');
  console.log('Cache des utilisateurs nettoyé');
};

// Note: Ces services seront progressivement migrés vers 
// l'architecture centralisée dans apiService.ts
