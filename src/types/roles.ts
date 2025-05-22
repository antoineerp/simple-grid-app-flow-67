
export type UserRole = 'admin' | 'gestionnaire' | 'utilisateur' | 'administrateur';

// Permissions par rôle d'utilisateur
export const hasPermission: Record<UserRole, { isAdmin: boolean }> = {
  admin: { isAdmin: true },
  administrateur: { isAdmin: true },
  gestionnaire: { isAdmin: false },
  utilisateur: { isAdmin: false }
};

// Function to check permissions based on role
export const checkPermission = (role: UserRole, permission: keyof typeof hasPermission[UserRole]): boolean => {
  // Si aucun rôle n'est fourni ou si le rôle n'est pas reconnu, refuser la permission
  if (!role || !hasPermission[role]) {
    return false;
  }
  return hasPermission[role][permission] === true;
};
