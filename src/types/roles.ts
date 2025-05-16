
export type UserRole = 'administrateur' | 'admin' | 'utilisateur' | 'gestionnaire';

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
      '/bibliotheque',
      '/collaboration'
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
      '/bibliotheque',
      '/collaboration'
    ],
    editTables: ['*'],
    createUsers: false,
    accessAdminPanel: false,
    limitedCount: 1
  }
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions, context?: string): boolean {
  // Si c'est admin ou administrateur, accorder automatiquement l'accès au panneau d'administration
  if ((role === 'admin' || role === 'administrateur') && permission === 'accessAdminPanel') {
    return true;
  }
  
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

export function hasRoleLimit(role: UserRole): boolean {
  return typeof ROLE_PERMISSIONS[role]?.limitedCount === 'number';
}

export function getRoleLimit(role: UserRole): number {
  return ROLE_PERMISSIONS[role]?.limitedCount || Infinity;
}
