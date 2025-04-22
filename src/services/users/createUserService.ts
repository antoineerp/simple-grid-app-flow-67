
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe: string;
}

export const createUser = async (userData: CreateUserData) => {
  // Validation du mot de passe
  if (userData.mot_de_passe.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }

  // Générer l'identifiant technique
  const identifiantTechnique = `p71x6d_${userData.prenom.toLowerCase()}_${userData.nom.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');

  try {
    const response = await fetch(`${getApiUrl()}/utilisateurs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...userData,
        identifiant_technique: identifiantTechnique
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erreur lors de la création de l'utilisateur");
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};
