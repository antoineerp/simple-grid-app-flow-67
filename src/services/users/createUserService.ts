
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
    const url = `${apiUrl}/utilisateurs`;
    
    console.log(`Envoi de la requête à ${url}`);
    const headers = getAuthHeaders();
    
    // Préparation des données
    const requestData = {
      ...userData,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées:", JSON.stringify(requestData));
    
    // Vérification de l'email
    try {
      const checkEmailUrl = `${apiUrl}/check-users.php?email=${encodeURIComponent(userData.email)}`;
      console.log(`Vérification de l'email: ${checkEmailUrl}`);
      
      const emailCheckResponse = await fetch(checkEmailUrl, { method: 'GET', headers });
      
      if (emailCheckResponse.ok) {
        const checkResult = await emailCheckResponse.json();
        console.log("Résultat de la vérification d'email:", checkResult);
        
        if (checkResult && checkResult.records && Array.isArray(checkResult.records)) {
          const existingUser = checkResult.records.find((user: any) => 
            user.email === userData.email
          );
          
          if (existingUser) {
            console.error("Un utilisateur avec cet email existe déjà:", existingUser);
            throw new Error(`Un utilisateur avec l'email ${userData.email} existe déjà.`);
          }
        }
      }
    } catch (checkError) {
      // Si l'erreur est liée à la vérification de l'email existant, la propager
      if (checkError instanceof Error && checkError.message.includes('email existe déjà')) {
        throw checkError;
      }
      // Sinon, continuer avec la création même si la vérification a échoué
      console.warn("Erreur lors de la vérification de l'email, poursuite de la création:", checkError);
    }
    
    // Envoi de la requête principale
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    // Traitement de la réponse en texte d'abord
    const responseText = await response.text();
    console.log("Statut de la réponse:", response.status, response.statusText);
    console.log("Réponse brute:", responseText);
    
    // Essai de parse en JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      
      // Si la réponse semble être un succès malgré le format incorrect
      if (response.ok || response.status === 201) {
        return { 
          success: true, 
          message: "Utilisateur créé avec succès (réponse non-JSON)",
          identifiant_technique: identifiantTechnique 
        };
      }
      
      throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}`);
    }
    
    // Gestion des erreurs HTTP
    if (!response.ok) {
      console.error("Erreur HTTP:", response.status, responseData);
      
      // Erreurs spécifiques
      if (response.status === 409 || (responseData.message && responseData.message.includes('existe déjà'))) {
        if (responseData.field === 'email' || responseData.message.includes('email')) {
          throw new Error(`Un utilisateur avec l'email ${userData.email} existe déjà.`);
        } else if (responseData.field === 'identifiant_technique' || responseData.message.includes('identifiant_technique')) {
          // Générer un nouvel identifiant et réessayer
          console.log("Génération d'un nouvel identifiant technique et nouvel essai");
          const newTimestamp = new Date().getTime();
          const newRandomStr = Math.random().toString(36).substring(2, 10);
          requestData.identifiant_technique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${newRandomStr}_${newTimestamp}`.substring(0, 50);
          
          return createUser(userData); // Appel récursif
        }
      }
      
      throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
    }
    
    // Succès
    return {
      ...responseData,
      success: true,
      identifiant_technique: identifiantTechnique
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
