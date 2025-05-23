
// types/roles.ts
// Types et utilitaires liés aux rôles utilisateurs

export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur';

export type Permission = 'isAdmin';

// Fonction pour vérifier si un rôle a une permission spécifique
export const checkPermission = (role: UserRole, permission: Permission): boolean => {
  switch (permission) {
    case 'isAdmin':
      return role === 'admin';
    default:
      return false;
  }
};

// Fonction pour traduire un rôle en français
export const translateRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'gestionnaire':
      return 'Gestionnaire';
    case 'utilisateur':
      return 'Utilisateur';
    default:
      return 'Inconnu';
  }
};
