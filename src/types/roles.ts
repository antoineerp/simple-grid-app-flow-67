
export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur';

// Vérifier si l'utilisateur a une permission spécifique
export const checkPermission = (userRole: UserRole | null | undefined, permission: 'isAdmin' | 'isGestionnaire' | 'canEditExigences'): boolean => {
  if (!userRole) return false;
  
  switch (permission) {
    case 'isAdmin':
      return userRole === 'admin';
    
    case 'isGestionnaire':
      return userRole === 'admin' || userRole === 'gestionnaire';
    
    case 'canEditExigences':
      return userRole === 'admin' || userRole === 'gestionnaire';
    
    default:
      return false;
  }
};

// Obtenir le niveau de permission (1: admin, 2: gestionnaire, 3: utilisateur)
export const getPermissionLevel = (userRole: UserRole | null | undefined): number => {
  if (!userRole) return 0;
  
  switch (userRole) {
    case 'admin':
      return 1;
    case 'gestionnaire':
      return 2;
    case 'utilisateur':
      return 3;
    default:
      return 0;
  }
};
