
import { getCurrentUser } from '@/services/auth/authService';

// Extract a valid user ID from various user object formats
export const extractValidUserId = (user: any): string => {
  if (!user) {
    console.warn("Aucun utilisateur fourni, utilisation de l'ID système");
    return 'p71x6d_system';
  }
  
  // If it's already a string, return it directly
  if (typeof user === 'string') {
    return user;
  }
  
  // If it's an object, try to extract an identifier
  if (typeof user === 'object') {
    // Check if the object is null
    if (user === null) {
      console.warn("Objet utilisateur null, utilisation de l'ID système");
      return 'p71x6d_system';
    }
    
    // Potential IDs by priority order
    const possibleIds = ['identifiant_technique', 'email', 'id'];
    
    for (const idField of possibleIds) {
      if (user[idField] && typeof user[idField] === 'string') {
        console.log(`ID utilisateur extrait: ${idField} = ${user[idField]}`);
        return user[idField];
      }
    }
    
    console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur:", user);
  }
  
  console.warn("Type d'utilisateur non pris en charge, utilisation de l'ID système");
  return 'p71x6d_system';
};

// Get current user ID in a consistent format
export const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  const userId = extractValidUserId(user);
  console.log("ID utilisateur extrait:", userId);
  return userId;
};
