
/**
 * Service de création d'utilisateurs
 * Utilise UNIQUEMENT la base de données p71x6d_richard
 */

import { toast } from '@/components/ui/use-toast';
import { createDbUser } from '../core/databaseConnectionManager';

// Interface pour les données utilisateur
interface UserData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe?: string;
}

// Interface pour le résultat de la création
interface CreateUserResult {
  success: boolean;
  message: string;
  identifiant_technique?: string;
}

/**
 * Crée un nouvel utilisateur dans la base de données
 * Utilise UNIQUEMENT p71x6d_richard
 */
export const createUser = async (userData: UserData): Promise<CreateUserResult> => {
  try {
    console.log('Création d\'un nouvel utilisateur avec la base fixe p71x6d_richard:', userData.prenom, userData.nom);
    
    // Appel au service centralisé qui garantit l'utilisation de p71x6d_richard
    const response = await createDbUser(userData);
    
    if (!response) {
      throw new Error('Aucune réponse du serveur');
    }
    
    // Vérifier si la réponse contient des erreurs
    if (response.error || !response.success) {
      throw new Error(response.message || 'Échec de la création de l\'utilisateur');
    }
    
    console.log('Utilisateur créé avec succès dans la table utilisateurs_p71x6d_richard');
    
    // Retourner le résultat avec l'identifiant technique
    return {
      success: true,
      message: 'Utilisateur créé avec succès',
      identifiant_technique: response.user?.identifiant_technique || response.identifiant_technique
    };
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    // Notifier l'erreur
    toast({
      variant: "destructive",
      title: "Erreur lors de la création de l'utilisateur",
      description: error instanceof Error ? error.message : "Une erreur inconnue est survenue"
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur inconnue est survenue"
    };
  }
};
