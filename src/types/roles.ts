
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
      '/gestion-documentaire'
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
      '/bibliotheque'
    ],
    editTables: [],
    createUsers: false,
    accessAdminPanel: false
  }
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions, context?: string): boolean {
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
