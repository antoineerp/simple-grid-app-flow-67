
export type UserRole = 'admin' | 'administrateur' | 'utilisateur' | 'gestionnaire';

export interface RolePermissions {
  viewPages: string[];
  editTables: string[];
  createUsers: boolean;
  accessAdminPanel: boolean;
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
  gestionnaire: {
    viewPages: [
      '/pilotage', 
      '/exigences', 
      '/gestion-documentaire',
      '/ressources-humaines',
      '/bibliotheque'
    ],
    editTables: [
      'exigences', 
      'documents'
    ],
    createUsers: false,
    accessAdminPanel: false
  },
  utilisateur: {
    viewPages: [
      '/pilotage', 
      '/exigences',
      '/gestion-documentaire',
      '/ressources-humaines',
      '/bibliotheque'
    ],
    editTables: [
      'exigences',
      'documents'
    ],
    createUsers: false,
    accessAdminPanel: false
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
      return userPermissions[permission];
  }
}
