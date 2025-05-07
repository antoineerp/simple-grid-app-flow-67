
export type UserRole = 'administrateur' | 'utilisateur' | 'gestionnaire' | 'admin';

export interface RolePermissions {
  viewPages: string[];
  editTables: string[];
  createUsers: boolean;
  accessAdminPanel: boolean;
  limitedCount?: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  administrateur: {
    viewPages: ['*'],
    editTables: ['*'],
    createUsers: true,
    accessAdminPanel: true
  },
  admin: {
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
    editTables: ['*'],
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
    editTables: ['*'],
    createUsers: false,
    accessAdminPanel: false,
    limitedCount: 1
  }
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions, context?: string): boolean {
  // Si pas de rôle défini ou rôle non valide, vérifier si c'est "admin" (cas spécial)
  if (!role || !ROLE_PERMISSIONS[role]) {
    // Considérer "admin" comme équivalent à "administrateur" pour la rétrocompatibilité
    if (role === 'admin') {
      role = 'administrateur';
    } else {
      return false;
    }
  }
  
  const userPermissions = ROLE_PERMISSIONS[role];
  
  switch (permission) {
    case 'viewPages':
      return userPermissions.viewPages.includes('*') || 
             userPermissions.viewPages.includes(context || '');
    case 'editTables':
      return userPermissions.editTables.includes('*') || 
             (context ? userPermissions.editTables.includes(context) : false);
    case 'accessAdminPanel':
      // Accès spécial pour admin et administrateur
      if (role === 'admin' || role === 'administrateur') {
        return true;
      }
      return userPermissions[permission] as boolean;
    default:
      return userPermissions[permission] as boolean;
  }
}

export function hasRoleLimit(role: UserRole): boolean {
  return typeof ROLE_PERMISSIONS[role]?.limitedCount === 'number';
}

export function getRoleLimit(role: UserRole): number {
  return ROLE_PERMISSIONS[role]?.limitedCount || Infinity;
}
