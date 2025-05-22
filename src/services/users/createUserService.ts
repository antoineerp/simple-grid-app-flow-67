
/**
 * Service de création d'utilisateurs
 * Utilise UNIQUEMENT la base de données p71x6d_richard
 */

import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

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
    console.log('Création d\'un nouvel utilisateur:', userData.prenom, userData.nom);
    
    // Appel à l'API pour créer l'utilisateur
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/users.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'X-Forced-DB-User': 'p71x6d_richard', // Forcer l'utilisation de p71x6d_richard
        'X-User-Prefix': 'p71x6d_richard' // Préfixe utilisateur pour l'isolation des données
      },
      body: JSON.stringify(userData)
    });
    
    // Vérifier si la requête a réussi
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Réponse serveur non-OK:', response.status, errorText);
      
      // Tenter de parser l'erreur comme JSON
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Erreur ${response.status}: ${errorJson.status || 'Échec de la création'}`);
      } catch (parseError) {
        throw new Error(`Erreur ${response.status}: ${errorText || 'Échec de la création de l\'utilisateur'}`);
      }
    }
    
    // Parser la réponse JSON
    const data = await response.json();
    
    // Vérifier si la réponse contient des erreurs
    if (data.status === 'error' || !data.success) {
      throw new Error(data.message || 'Échec de la création de l\'utilisateur');
    }
    
    console.log('Utilisateur créé avec succès:', data);
    
    // Notifier le succès
    toast({
      title: "Utilisateur créé",
      description: `${userData.prenom} ${userData.nom} a été créé avec succès.`
    });
    
    // Retourner le résultat avec l'identifiant technique
    return {
      success: true,
      message: 'Utilisateur créé avec succès',
      identifiant_technique: data.user?.identifiant_technique || data.identifiant_technique
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
