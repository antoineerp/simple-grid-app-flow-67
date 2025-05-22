
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { UserRole, checkPermission } from '@/types/roles';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Ajouter une fonction pour vérifier facilement les permissions basées sur le rôle
  const hasPermission = (permission: keyof typeof checkPermission) => {
    const role = context.userRole as UserRole | undefined;
    return role ? checkPermission(role, 'isAdmin') : false;
  };
  
  return {
    ...context,
    hasPermission
  };
}
