
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
  const id = uuidv4(); // Générer un UUID v4 pour l'ID

  try {
    const apiUrl = getApiUrl();
    // Use UserController.php instead of UsersController.php
    const url = `${apiUrl}/controllers/UserController.php`;
    
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    };
    
    const requestData = {
      id,
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
    
    // Vérifier d'abord si la réponse est OK
    if (!response.ok) {
      if (response.status === 500) {
        console.error("Erreur serveur 500 détectée");
        throw new Error(`Erreur serveur interne: ${response.status} ${response.statusText}`);
      }
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Tenter de récupérer le texte de la réponse
    const responseText = await response.text();
    console.log("Réponse brute du serveur:", responseText);
    
    // Si la réponse est vide mais le statut est OK, considérer comme un succès
    if (!responseText && response.ok) {
      console.log("Réponse vide mais statut OK, considéré comme un succès");
      return {
        success: true,
        identifiant_technique: identifiantTechnique,
        message: "L'utilisateur a été créé avec succès"
      };
    }
    
    // Tenter de parser le JSON
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log("Réponse parsée:", responseData);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      if (response.ok) {
        console.log("Considéré comme un succès malgré l'erreur de parsing");
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "L'utilisateur a été créé avec succès"
        };
      }
      throw new Error(`Réponse invalide du serveur (format incorrect): ${responseText.substring(0, 100)}`);
    }

    // Vérifier le contenu de la réponse
    if (responseData && typeof responseData === 'object') {
      if (responseData.status === 'error') {
        throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return {
        ...responseData,
        success: true,
        identifiant_technique: identifiantTechnique
      };
    } else {
      if (response.ok) {
        return {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "L'utilisateur a été créé avec succès"
        };
      }
      throw new Error(`Format de réponse invalide: ${typeof responseData}`);
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
