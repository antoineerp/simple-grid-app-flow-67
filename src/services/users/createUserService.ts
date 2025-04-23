
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
        const errorText = await dbTestResponse.text();
        console.warn("Le test de connexion à la base de données a échoué avec le statut:", dbTestResponse.status);
        console.warn("Détails de l'erreur:", errorText);
        throw new Error(`Échec du test de connexion à la base de données (${dbTestResponse.status}): ${errorText.substring(0, 100)}`);
      }
    } catch (dbTestError) {
      console.error("Erreur lors du test de connexion à la base de données:", dbTestError);
      throw new Error(`Échec de la vérification de la base de données: ${dbTestError instanceof Error ? dbTestError.message : 'Erreur inconnue'}`);
    }
    
    // Une fois la connexion à la base de données vérifiée, envoyer la requête de création d'utilisateur
    console.log(`Envoi de la requête de création d'utilisateur à ${apiUrl}/utilisateurs`);
    const response = await fetch(`${apiUrl}/utilisateurs`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData)
    });
    
    console.log("Statut de la réponse finale:", response.status, response.statusText);
    
    // Récupérer le texte brut de la réponse pour diagnostiquer les problèmes
    const responseText = await response.text();
    console.log("Réponse brute du serveur:", responseText);
    
    // Vérifier si le texte est vide
    if (!responseText || responseText.trim() === '') {
      console.error("Réponse vide du serveur");
      
      if (response.status >= 200 && response.status < 300) {
        // Si le statut est OK malgré la réponse vide, on considère que c'est un succès
        return { 
          success: true, 
          message: "Utilisateur créé avec succès (réponse vide)",
          identifiant_technique: identifiantTechnique 
        };
      } else {
        throw new Error(`Erreur ${response.status}: Réponse vide du serveur`);
      }
    }
    
    // Vérifier si le texte est un JSON valide
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("Données JSON analysées:", responseData);
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      console.error("Texte reçu qui a causé l'erreur:", responseText);
      
      // Si la réponse contient "créé avec succès", on considère que c'est un succès malgré l'erreur de parsing
      if (responseText.includes("créé avec succès") || response.status >= 200 && response.status < 300) {
        return { 
          success: true, 
          message: "Utilisateur créé avec succès (réponse non-JSON)",
          identifiant_technique: identifiantTechnique 
        };
      }
      
      throw new Error(`Réponse non valide du serveur: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error("Erreur HTTP lors de la création de l'utilisateur:", response.status, responseData);
      throw new Error(responseData.message || `Erreur lors de la création de l'utilisateur (${response.status})`);
    }

    // Ajouter l'identifiant technique à la réponse pour faciliter la connexion ultérieure
    return {
      ...responseData,
      identifiant_technique: identifiantTechnique
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
