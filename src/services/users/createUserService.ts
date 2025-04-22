
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
    
    // Essayez les routes dans l'ordre, de la plus spécifique à la plus générique
    const routes = [
      `${apiUrl}/controllers/UsersController.php`,
      `${apiUrl}/utilisateurs`,
      `${apiUrl}/utilisateurs.php`
    ];
    
    let response = null;
    let lastError = null;
    
    // Tester la connexion à la base de données d'abord
    try {
      console.log(`Test de la connexion à la base de données avant de créer l'utilisateur: ${apiUrl}/db-connection-test`);
      const dbTestResponse = await fetch(`${apiUrl}/db-connection-test`, {
        method: 'GET',
        headers: headers
      });
      
      if (dbTestResponse.ok) {
        const dbTestResult = await dbTestResponse.json();
        console.log("Résultat du test de connexion à la base de données:", dbTestResult);
        
        if (dbTestResult.status !== 'success') {
          console.error("Problème de connexion à la base de données:", dbTestResult.message || "Raison inconnue");
          throw new Error("Impossible de se connecter à la base de données. Vérifiez la configuration.");
        }
      } else {
        console.warn("Le test de connexion à la base de données a échoué avec le statut:", dbTestResponse.status);
      }
    } catch (dbTestError) {
      console.error("Erreur lors du test de connexion à la base de données:", dbTestError);
    }
    
    // Essayer chaque route jusqu'à ce qu'une fonctionne
    for (const route of routes) {
      try {
        console.log(`Essai avec l'URL: ${route}`);
        response = await fetch(route, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestData)
        });
        
        console.log(`Réponse de ${route}: ${response.status}`);
        
        // Si la réponse est réussie, sortir de la boucle
        if (response.status >= 200 && response.status < 300) {
          break;
        }
        
        // Sinon, enregistrer l'erreur et continuer
        const responseText = await response.text();
        lastError = `Erreur ${response.status} de ${route}: ${responseText}`;
        console.error(lastError);
      } catch (routeError) {
        console.error(`Erreur lors de la requête à ${route}:`, routeError);
        lastError = routeError instanceof Error ? routeError.message : "Erreur inconnue";
      }
    }
    
    // Si aucune route n'a fonctionné
    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(lastError || "Toutes les tentatives de création d'utilisateur ont échoué");
    }

    console.log("Statut de la réponse finale:", response.status);
    
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
