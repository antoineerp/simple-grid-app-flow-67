
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

  // Générer l'identifiant technique avec un timestamp pour éviter les doublons
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8); // Augmenté la longueur à 6 caractères
  const identifiantTechnique = `p71x6d_${userData.prenom.toLowerCase()}_${userData.nom.toLowerCase()}_${randomStr}_${timestamp}`.replace(/[^a-z0-9_]/g, '').substring(0, 50);

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
    
    // Vérifier explicitement si l'email existe déjà
    try {
      const checkEmailUrl = `${apiUrl}/check-users.php?email=${encodeURIComponent(userData.email)}`;
      console.log(`Vérification de l'email: ${checkEmailUrl}`);
      
      const emailCheckResponse = await fetch(checkEmailUrl, {
        method: 'GET',
        headers: headers
      });
      
      if (emailCheckResponse.ok) {
        const checkResult = await emailCheckResponse.json();
        console.log("Résultat de la vérification d'email:", checkResult);
        
        if (checkResult && checkResult.records && checkResult.records.length > 0) {
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
      console.error("Erreur lors de la vérification de l'email:", checkError);
      // On continue si c'est une autre erreur de vérification
    }
    
    // Une fois la vérification d'email effectuée, envoyer la requête de création d'utilisateur
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
      
      // Si la réponse contient une erreur de duplication, la capturer pour un message plus convivial
      if (responseText.includes("Integrity constraint violation: 1062") || 
          responseText.includes("Duplicate entry")) {
        // Déterminer si c'est l'email ou l'identifiant technique qui est dupliqué
        if (responseText.includes("email")) {
          throw new Error(`Un utilisateur avec l'email ${userData.email} existe déjà.`);
        } else if (responseText.includes("identifiant_technique")) {
          // Générer un nouvel identifiant et réessayer
          console.log("Identifiant technique dupliqué, tentative avec un nouvel identifiant...");
          const newTimestamp = new Date().getTime();
          const newRandomStr = Math.random().toString(36).substring(2, 8);
          const newIdentifiant = `p71x6d_${userData.prenom.toLowerCase()}_${userData.nom.toLowerCase()}_${newRandomStr}_${newTimestamp}`.replace(/[^a-z0-9_]/g, '').substring(0, 50);
          
          requestData.identifiant_technique = newIdentifiant;
          return createUser(userData); // Appel récursif avec le nouvel identifiant
        } else {
          throw new Error("Un utilisateur avec des informations identiques existe déjà.");
        }
      }
      
      throw new Error(`Réponse non valide du serveur: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error("Erreur HTTP lors de la création de l'utilisateur:", response.status, responseData);
      
      // Vérifier si l'erreur est liée à une duplication
      if (responseData.message && (
          responseData.message.includes("Duplicate entry") || 
          responseData.message.includes("exists") || 
          responseData.message.includes("existe déjà"))) {
        
        if (responseData.message.includes("email")) {
          throw new Error(`Un utilisateur avec l'email ${userData.email} existe déjà.`);
        } else if (responseData.message.includes("identifiant_technique")) {
          // Générer un nouvel identifiant et réessayer
          console.log("Identifiant technique dupliqué, tentative avec un nouvel identifiant...");
          const newTimestamp = new Date().getTime();
          const newRandomStr = Math.random().toString(36).substring(2, 8);
          const newIdentifiant = `p71x6d_${userData.prenom.toLowerCase()}_${userData.nom.toLowerCase()}_${newRandomStr}_${newTimestamp}`.replace(/[^a-z0-9_]/g, '').substring(0, 50);
          
          requestData.identifiant_technique = newIdentifiant;
          return createUser(userData); // Appel récursif avec le nouvel identifiant
        }
      }
      
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
