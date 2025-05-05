
export type UserRole = 'admin' | 'administrateur' | 'utilisateur' | 'gestionnaire';

export interface RolePermissions {
  viewPages: string[];
  editTables: string[];
  createUsers: boolean;
  accessAdminPanel: boolean;
  limitedCount?: number; // Nombre maximum d'utilisateurs pour ce rôle
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    viewPages: ['*'],
    editTables: ['*'],
    createUsers: true,
    accessAdminPanel: true
  },
  administrateur: {
    viewPages: ['*'],
    editTables: ['*'],
    createUsers: true,
    accessAdminPanel: true
  },
  utilisateur: {
    viewPages: [
      '/pilotage', 
      '/exigences',
      '/gestion-documentaire',
      '/ressources-humaines',
      '/bibliotheque'
    ],
    editTables: ['*'], // Maintenant l'utilisateur peut modifier tous les tableaux
    createUsers: false,
    accessAdminPanel: false
  },
  gestionnaire: {
    viewPages: [
      '/pilotage', 
      '/exigences',
      '/gestion-documentaire',
      '/ressources-humaines',
      '/bibliotheque'
    ],
    editTables: ['*'], // Le gestionnaire aussi peut modifier tous les tableaux
    createUsers: false,
    accessAdminPanel: false,
    limitedCount: 1 // Un seul compte gestionnaire autorisé
  }
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions, context?: string): boolean {
  // Si le rôle n'existe pas, aucune permission
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  
  const userPermissions = ROLE_PERMISSIONS[role];
  
  switch (permission) {
    case 'viewPages':
      return userPermissions.viewPages.includes('*') || 
             userPermissions.viewPages.includes(context || '');
    case 'editTables':
      return userPermissions.editTables.includes('*') || 
             (context ? userPermissions.editTables.includes(context) : false);
    default:
      return userPermissions[permission] as boolean;
  }
}

// Vérifier si un rôle a une limite de nombre d'utilisateurs
export function hasRoleLimit(role: UserRole): boolean {
  return typeof ROLE_PERMISSIONS[role]?.limitedCount === 'number';
}

// Obtenir la limite d'utilisateurs pour un rôle donné
export function getRoleLimit(role: UserRole): number {
  return ROLE_PERMISSIONS[role]?.limitedCount || Infinity;
}
