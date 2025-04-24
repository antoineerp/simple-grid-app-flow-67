
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
  console.log("Création d'utilisateur - Données reçues:", userData);
  
  // Validation du mot de passe
  if (userData.mot_de_passe.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }

  // Génération de l'identifiant technique
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedPrenom = userData.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedNom = userData.nom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const identifiantTechnique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${randomStr}_${timestamp}`.substring(0, 50);

  console.log(`Identifiant technique généré: ${identifiantTechnique}`);

  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/utilisateurs`;
    
    console.log(`URL de la requête: ${url}`);
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
      body: JSON.stringify(requestData)
    });

    console.log("Statut de la réponse:", response.status, response.statusText);
    console.log("Headers de la réponse:", Object.fromEntries([...response.headers]));
    
    const responseText = await response.text();
    console.log("Réponse brute du serveur:", responseText);
    
    // Essai de parse en JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log("Réponse parsée:", responseData);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      if (response.status >= 200 && response.status < 300 && responseText.includes("success")) {
        // Si le statut est OK mais le parsing échoue, on essaye de traiter la réponse comme un succès
        console.log("Considéré comme un succès malgré l'erreur de parsing");
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "L'utilisateur a été créé avec succès"
        };
      }
      throw new Error(`Réponse invalide du serveur: ${responseText}`);
    }

    // Vérification du format de réponse attendu
    if (responseData && typeof responseData === 'object') {
      if (responseData.status === 'error') {
        throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return {
        ...responseData,
        success: true,
        identifiant_technique: identifiantTechnique
      };
    } else {
      if (response.ok) {
        // Si le statut est OK mais le format est inattendu, on retourne un succès par défaut
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "L'utilisateur a été créé avec succès"
        };
      }
      throw new Error("Format de réponse invalide");
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
