
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/hooks/use-toast';
import { initializeUserTables } from '../core/userInitializationService';

interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe: string;
}

// Génère un UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Tentative de création d'utilisateur via le endpoint de diagnostic
async function createUserViaDiagnostic(userData: any) {
  const apiUrl = getApiUrl();
  const diagnosticUrl = `${apiUrl}/api-diagnostic.php?action=createUser`;
  
  console.log("Tentative via diagnostic endpoint:", diagnosticUrl);
  
  const response = await fetch(diagnosticUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status} lors de la création via diagnostic`);
  }
  
  const responseText = await response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Si la réponse n'est pas du JSON valide mais que la requête a réussi
    if (response.ok) {
      return {
        success: true,
        message: "Utilisateur créé (réponse non-JSON)",
        identifiant_technique: userData.identifiant_technique
      };
    } else {
      throw new Error("Réponse invalide du serveur de diagnostic");
    }
  }
}

export const createUser = async (userData: CreateUserData) => {
  console.log("Tentative de création d'utilisateur:", userData.prenom, userData.nom);
  
  // Frontend validation
  const errors = [];
  
  // Required fields validation
  if (!userData.nom?.trim()) errors.push("Le nom est requis");
  if (!userData.prenom?.trim()) errors.push("Le prénom est requis");
  if (!userData.email?.trim()) errors.push("L'email est requis");
  if (!userData.role?.trim()) errors.push("Le rôle est requis");
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (userData.email && !emailRegex.test(userData.email)) {
    errors.push("Format d'email invalide");
  }
  
  // Password validation
  if (userData.mot_de_passe.length < 6) {
    errors.push("Le mot de passe doit contenir au moins 6 caractères");
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  // Génération de l'identifiant technique
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 8);
  // Utiliser uniquement les caractères autorisés pour éviter les problèmes d'encodage
  const sanitizedPrenom = userData.prenom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedNom = userData.nom.toLowerCase().replace(/[^a-z0-9]/g, '');
  const identifiantTechnique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${randomStr}_${timestamp}`.substring(0, 50);

  console.log(`Identifiant technique généré: ${identifiantTechnique}`);

  // Génération d'un UUID pour l'ID
  const uuid = generateUUID();
  console.log(`UUID généré pour l'ID: ${uuid}`);

  try {
    // Préparation de la requête
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/users`;
    
    console.log(`Envoi de la requête à ${url}`);
    const headers = getAuthHeaders();
    
    // Préparation des données
    const requestData = {
      ...userData,
      id: uuid,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées:", JSON.stringify(requestData));
    
    // Envoi de la requête principale
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(requestData),
      cache: 'no-store'
    });
    
    console.log("Statut de la réponse:", response.status, response.statusText);
    console.log("Headers de réponse:", Object.fromEntries(response.headers.entries()));
    
    // Traitement de la réponse en texte d'abord
    const responseText = await response.text();
    console.log("Réponse brute:", responseText);
    
    // Gérer les réponses vides
    if (!responseText || responseText.trim() === '') {
      if (response.ok || response.status === 201) {
        // Si la réponse est vide mais le statut est OK, considérer comme un succès
        
        // Initialiser les tables de l'utilisateur
        await initializeUserTables(identifiantTechnique);
        
        // Force un rechargement complet après création
        console.log("Rechargement forcé dans 2 secondes pour refléter la création de l'utilisateur");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
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
        throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      // Initialiser les tables de l'utilisateur
      await initializeUserTables(identifiantTechnique);
      
      return {
        ...responseData,
        success: true,
        identifiant_technique: identifiantTechnique
      };
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      
      // Si la réponse semble être du HTML ou contient des erreurs PHP
      if (responseText.includes("<br />") || responseText.includes("Warning") || responseText.includes("Fatal error")) {
        throw new Error("Erreur serveur PHP. Vérifiez les logs du serveur.");
      }
      
      // Si la réponse semble être un succès malgré le format incorrect
      if (response.ok || response.status === 201) {
        // Initialiser les tables de l'utilisateur
        await initializeUserTables(identifiantTechnique);
        
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
      console.log("Tentative de création via le endpoint de diagnostic...");
      const diagnosticResult = await createUserViaDiagnostic({
        ...userData,
        id: uuid,
        identifiant_technique: identifiantTechnique
      });
      
      // Initialiser les tables de l'utilisateur
      await initializeUserTables(identifiantTechnique);
      
      return diagnosticResult;
    } catch (fallbackError) {
      console.error("Échec de la création via le endpoint de diagnostic:", fallbackError);
      throw error; // Renvoyer l'erreur originale
    }
  }
};
