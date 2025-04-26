
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

  // Génération de l'identifiant technique
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  // Utiliser uniquement les caractères autorisés pour éviter les problèmes d'encodage
  const sanitizedPrenom = userData.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedNom = userData.nom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const identifiantTechnique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${randomStr}_${timestamp}`.substring(0, 50);

  console.log(`Identifiant technique généré: ${identifiantTechnique}`);

  try {
    // Préparation de la requête
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/users`;
    
    console.log(`Envoi de la requête à ${url}`);
    
    // Préparation des données
    const requestData = {
      ...userData,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées:", JSON.stringify(requestData));
    
    // Envoi de la requête principale
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestData),
      cache: 'no-store'
    });
    
    console.log("Statut de la réponse:", response.status, response.statusText);
    
    // Traitement de la réponse en texte d'abord
    const responseText = await response.text();
    console.log("Réponse brute:", responseText);
    
    // Gérer les réponses vides
    if (!responseText || responseText.trim() === '') {
      if (response.ok || response.status === 201) {
        // Si la réponse est vide mais le statut est OK, considérer comme un succès
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "Utilisateur créé avec succès (réponse vide)"
        };
      } else {
        // Si la réponse est vide avec un statut d'erreur, lancer une erreur
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }
    }
    
    // Essai de parse en JSON si la réponse n'est pas vide
    try {
      const responseData = JSON.parse(responseText);
      
      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorMsg = responseData.message || `Erreur ${response.status}: ${response.statusText}`;
        console.error("Erreur API:", errorMsg);
        throw new Error(errorMsg);
      }
      
      // Succès avec réponse JSON
      return {
        ...responseData,
        success: true,
        identifiant_technique: identifiantTechnique
      };
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      
      // Si la réponse semble être du HTML ou contient des erreurs PHP
      if (responseText.includes("<br />") || responseText.includes("Warning") || responseText.includes("Fatal error")) {
        console.error("Réponse HTML/PHP détectée:", responseText.substring(0, 500));
        throw new Error("Erreur serveur PHP. Vérifiez les logs du serveur.");
      }
      
      // Si la réponse semble être un succès malgré le format incorrect
      if (response.ok || response.status === 201) {
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "Utilisateur créé avec succès (réponse non-JSON)"
        };
      } else {
        throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    
    // Essayer de créer l'utilisateur via le endpoint de diagnostic en cas d'échec
    try {
      console.log("Tentative de solution de secours via check-users");
      const diagnosticResult = await createUserViaDiagnostic({
        ...userData,
        identifiant_technique: identifiantTechnique
      });
      return diagnosticResult;
    } catch (fallbackError) {
      console.error("Échec de la création via le endpoint de diagnostic:", fallbackError);
      throw error; // Renvoyer l'erreur d'origine si la solution de secours échoue également
    }
  }
};

// Fonction de secours pour créer un utilisateur via le endpoint de diagnostic
const createUserViaDiagnostic = async (userData: any) => {
  console.log("Tentative de création d'utilisateur via le endpoint de diagnostic");
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/check-users`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  const result = await response.json();
  
  return {
    ...result,
    success: true,
    identifiant_technique: userData.identifiant_technique
  };
};
