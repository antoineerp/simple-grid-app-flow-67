
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';

interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe: string;
}

export const createUser = async (userData: CreateUserData) => {
  console.log("Tentative de création d'utilisateur:", userData.prenom, userData.nom);
  
  // Validation du mot de passe
  if (userData.mot_de_passe.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }

  // Générer l'identifiant technique
  const identifiantTechnique = `p71x6d_${userData.prenom.toLowerCase()}_${userData.nom.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');

  try {
    const apiUrl = getApiUrl();
    console.log(`Envoi de la requête à ${apiUrl}/utilisateurs avec identifiant: ${identifiantTechnique}`);
    
    const headers = getAuthHeaders();
    console.log("Headers utilisés:", headers);
    
    const requestData = {
      ...userData,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées:", JSON.stringify(requestData));
    
    // Essayez d'abord avec /api/controllers/UsersController.php directement
    const controllerUrl = `${apiUrl}/controllers/UsersController.php`;
    
    console.log(`Essai avec URL contrôleur direct: ${controllerUrl}`);
    let response;
    
    try {
      response = await fetch(controllerUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      });
      
      console.log(`Réponse URL contrôleur direct: ${response.status}`);
    } catch (directError) {
      console.error("Erreur lors de la requête directe:", directError);
      
      // Si l'accès direct échoue, essayer via l'API router (/api/utilisateurs)
      console.log(`Essai via router API: ${apiUrl}/utilisateurs`);
      
      response = await fetch(`${apiUrl}/utilisateurs`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData)
      });
      
      // Si ça échoue encore, essayer un troisième chemin
      if (!response.ok) {
        console.log(`Essai via PHP file direct: ${apiUrl}/utilisateurs.php`);
        
        response = await fetch(`${apiUrl}/utilisateurs.php`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestData)
        });
      }
    }

    console.log("Statut de la réponse:", response.status);
    
    // Récupérer le texte brut de la réponse pour diagnostiquer les problèmes
    const responseText = await response.text();
    console.log("Réponse brute du serveur:", responseText);
    
    // Vérifier si le texte est vide
    if (!responseText || responseText.trim() === '') {
      console.error("Réponse vide du serveur");
      
      if (response.status >= 200 && response.status < 300) {
        // Si le statut est OK malgré la réponse vide, on considère que c'est un succès
        return { success: true, message: "Utilisateur créé avec succès (réponse vide)" };
      } else {
        throw new Error(`Erreur ${response.status}: Réponse vide du serveur`);
      }
    }
    
    // Vérifier si le texte est un JSON valide
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      console.error("Texte reçu qui a causé l'erreur:", responseText);
      
      // Si la réponse contient "créé avec succès", on considère que c'est un succès malgré l'erreur de parsing
      if (responseText.includes("créé avec succès") || response.status >= 200 && response.status < 300) {
        return { success: true, message: "Utilisateur créé avec succès (réponse non-JSON)" };
      }
      
      throw new Error(`Réponse non valide du serveur: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      throw new Error(responseData.message || "Erreur lors de la création de l'utilisateur");
    }

    return responseData;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
