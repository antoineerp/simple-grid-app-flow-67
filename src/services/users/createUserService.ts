
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types/roles';

interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  role: 'admin' | 'user' | 'gestionnaire';
  mot_de_passe: string;
}

export const createUser = async (userData: CreateUserData) => {
  console.log("Création d'utilisateur - Données reçues:", userData);
  
  if (userData.mot_de_passe.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }

  // Ensure role is valid
  if (!['admin', 'user', 'gestionnaire'].includes(userData.role)) {
    console.warn(`Role invalide: ${userData.role}, utilisation de 'user' par défaut`);
    userData.role = 'user';
  }

  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedPrenom = userData.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedNom = userData.nom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const identifiantTechnique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${randomStr}_${timestamp}`.substring(0, 50);
  
  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/controllers/UserController.php`;
    console.log("URL de l'API pour création d'utilisateur:", url);
    
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    };
    
    const requestData = {
      ...userData,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées à l'API:", JSON.stringify(requestData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(30000) // 30 secondes pour éviter les timeouts
    });

    console.log("Statut de la réponse:", response.status, response.statusText);
    console.log("Headers de la réponse:", Object.fromEntries([...response.headers]));
    
    // Récupérer le texte brut de la réponse
    const responseText = await response.text();
    console.log("Réponse brute du serveur:", responseText);
    
    // Tenter de parser en JSON si possible
    let responseData: any = {};
    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
        console.log("Réponse parsée:", responseData);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        if (!response.ok) {
          throw new Error(`Erreur serveur: ${responseText.substring(0, 500)}`);
        }
      }
    }
    
    // Vérifier si la requête a échoué
    if (!response.ok) {
      const errorMessage = responseData && typeof responseData === 'object' && 'message' in responseData
        ? String(responseData.message)
        : `Erreur ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    // Si la réponse est vide mais le statut est OK, considérer comme un succès
    if (!responseText && response.ok) {
      return {
        success: true,
        identifiant_technique: identifiantTechnique,
        message: "L'utilisateur a été créé avec succès"
      };
    }

    // Vérifier le contenu de la réponse
    if (responseData && typeof responseData === 'object') {
      if ('status' in responseData && responseData.status === 'error') {
        throw new Error(responseData.message ? String(responseData.message) : 'Erreur non spécifiée');
      }
      
      return {
        ...responseData,
        success: true,
        identifiant_technique: identifiantTechnique
      };
    }
    
    return {
      success: true,
      identifiant_technique: identifiantTechnique,
      message: "L'utilisateur a été créé avec succès"
    };
    
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    if (error instanceof TypeError && error.message.includes('AbortSignal')) {
      throw new Error("La requête a expiré. Le serveur a mis trop de temps à répondre.");
    }
    throw error;
  }
};
