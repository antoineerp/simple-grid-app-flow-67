
export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur' | 'administrateur';

// Permissions par rôle d'utilisateur
export const hasPermission: Record<UserRole, { isAdmin: boolean }> = {
  admin: { isAdmin: true },
  administrateur: { isAdmin: true },
  gestionnaire: { isAdmin: false },
  utilisateur: { isAdmin: false }
};
