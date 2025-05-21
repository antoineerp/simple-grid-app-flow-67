
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Utilitaire pour la validation de sécurité liée aux utilisateurs
 */

// Valide l'ID utilisateur et lance une erreur s'il est manquant
export const ensureUserIdPresent = (): string => {
  const userId = getCurrentUser();
  
  if (!userId) {
    console.error("ERREUR CRITIQUE: Tentative d'accès sans identifiant utilisateur");
    toast({
      title: "Erreur de sécurité",
      description: "Authentification requise pour cette opération",
      variant: "destructive"
    });
    throw new Error("ID utilisateur manquant");
  }
  
  return userId;
};

// Vérifier si une chaîne est un ID utilisateur valide
export const isValidUserId = (userId: string | null | undefined): boolean => {
  if (!userId) return false;
  
  // Valider le format de l'ID (ajuster selon votre format)
  // Exemple: minimum 4 caractères, pas d'espaces
  return userId.length >= 4 && !userId.includes(' ');
};

// Ajouter l'ID utilisateur à une URL
export const appendUserIdToUrl = (url: string): string => {
  const userId = ensureUserIdPresent();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}userId=${encodeURIComponent(userId)}`;
};

// Ajouter l'ID utilisateur à un objet de données
export const appendUserIdToData = <T extends Record<string, any>>(data: T): T & { userId: string } => {
  const userId = ensureUserIdPresent();
  return {
    ...data,
    userId
  };
};
