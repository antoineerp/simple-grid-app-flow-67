
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
  const identifiantTechnique = `p71x6d_${sanitizedPrenom}_${sanitizedNom}_${randomStr}`.substring(0, 50);

  console.log(`Identifiant technique généré: ${identifiantTechnique}`);

  // Génération d'un UUID pour l'ID
  const uuid = generateUUID();
  console.log(`UUID généré pour l'ID: ${uuid}`);

  // Variable pour suivre si l'utilisateur a été créé avec succès
  let userCreated = false;
  let creationResult = null;

  try {
    // Préparation de la requête
    const apiUrl = getApiUrl();
    // Utiliser le point d'entrée check-users.php qui fonctionne déjà
    const url = `${apiUrl}/check-users.php`;
    
    console.log(`Envoi de la requête à ${url}`);
    const headers = getAuthHeaders();
    
    // Préparation des données
    const requestData = {
      ...userData,
      id: uuid,
      identifiant_technique: identifiantTechnique
    };
    
    console.log("Données envoyées:", JSON.stringify(requestData));
    
    // Envoi de la requête principale avec un timeout plus long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
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
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log("Statut de la réponse:", response.status, response.statusText);
    console.log("Headers de réponse:", Object.fromEntries(response.headers.entries()));
    
    // Traitement de la réponse en texte d'abord
    const responseText = await response.text();
    console.log("Réponse brute:", responseText);
    
    // Gérer les réponses vides
    if (!responseText || responseText.trim() === '') {
      if (response.ok || response.status === 201) {
        // Si la réponse est vide mais le statut est OK, considérer comme un succès
        console.log("Réponse vide mais statut OK, considéré comme succès");
        userCreated = true;
        creationResult = {
          success: true,
          identifiant_technique: identifiantTechnique,
          message: "Utilisateur créé avec succès (réponse vide)"
        };
      } else {
        // Si la réponse est vide avec un statut d'erreur, lancer une erreur
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }
    } else {
      // Essai de parse en JSON si la réponse n'est pas vide
      try {
        const responseData = JSON.parse(responseText);
        
        // Gestion des erreurs HTTP
        if (!response.ok) {
          throw new Error(responseData.message || `Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Succès avec réponse JSON
        console.log("Création d'utilisateur réussie via check-users.php");
        userCreated = true;
        creationResult = {
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
          console.log("Format de réponse incorrect mais statut OK, considéré comme succès");
          userCreated = true;
          creationResult = {
            success: true,
            identifiant_technique: identifiantTechnique,
            message: "Utilisateur créé avec succès (réponse non-JSON)"
          };
        } else {
          throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}`);
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur via check-users.php:", error);
    
    // Essayer de créer l'utilisateur via le endpoint de test en cas d'échec
    try {
      console.log("Tentative de création via le endpoint de test...");
      const testResult = await createUserViaTest({
        ...userData,
        id: uuid,
        identifiant_technique: identifiantTechnique
      });
      
      console.log("Résultat de la création via endpoint de test:", testResult);
      
      if (testResult && testResult.success) {
        userCreated = true;
        creationResult = testResult;
      } else {
        throw new Error("Échec de la création via le endpoint de test");
      }
    } catch (fallbackError) {
      console.error("Échec de la création via le endpoint de test:", fallbackError);
      
      // Si les deux méthodes échouent, essayer avec users.php directement
      try {
        console.log("Dernière tentative via users.php...");
        const usersResult = await createUserViaUsers({
          ...userData,
          id: uuid,
          identifiant_technique: identifiantTechnique
        });
        
        console.log("Résultat de la création via users.php:", usersResult);
        
        if (usersResult && usersResult.success) {
          userCreated = true;
          creationResult = usersResult;
        } else {
          throw new Error("Échec de la création via users.php");
        }
      } catch (usersError) {
        console.error("Toutes les tentatives de création ont échoué:", usersError);
        throw error; // Renvoyer l'erreur d'origine
      }
    }
  } finally {
    console.log("État final de la création:", userCreated ? "SUCCÈS" : "ÉCHEC");
    
    // Vérifier si l'utilisateur a été créé avant de forcer le rechargement
    if (userCreated) {
      // Attendre un peu plus longtemps pour s'assurer que la base de données est mise à jour
      console.log("Rechargement forcé dans 3 secondes pour refléter la création de l'utilisateur");
      
      // Stocker l'état de la création dans le localStorage pour vérifier après le rechargement
      localStorage.setItem('last_user_creation', JSON.stringify({
        timestamp: Date.now(),
        identifiant: identifiantTechnique,
        success: true
      }));
      
      // Programmer le rechargement
      setTimeout(() => {
        console.log("Rechargement de la page...");
        window.location.reload();
      }, 3000);
    }
    
    // Retourner le résultat
    return creationResult || {
      success: false,
      message: "La création de l'utilisateur a échoué"
    };
  }
};

// Fonction pour générer un UUID conforme au format varchar(36)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fonction pour créer un utilisateur via le endpoint de test
const createUserViaTest = async (userData: any) => {
  console.log("Tentative de création d'utilisateur via le endpoint de test");
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/test.php?action=create-user`;
  
  // Inclure le timestamp pour éviter le cache
  const urlWithCache = `${url}&_=${Date.now()}`;
  
  const response = await fetch(urlWithCache, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur de réponse du endpoint de test:", errorText);
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  try {
    const result = await response.json();
    return {
      ...result,
      success: true,
      identifiant_technique: userData.identifiant_technique
    };
  } catch (e) {
    const responseText = await response.text();
    console.log("Réponse non-JSON du endpoint de test:", responseText);
    
    return {
      success: response.ok,
      message: "Opération terminée (réponse non-JSON)",
      identifiant_technique: userData.identifiant_technique
    };
  }
};

// Nouvelle fonction pour créer un utilisateur via users.php
const createUserViaUsers = async (userData: any) => {
  console.log("Tentative de création d'utilisateur via users.php");
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/users.php`;
  
  // Inclure le timestamp pour éviter le cache
  const urlWithCache = `${url}?_=${Date.now()}`;
  
  const response = await fetch(urlWithCache, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    body: JSON.stringify(userData)
  });
  
  const responseText = await response.text();
  console.log("Réponse de users.php:", responseText);
  
  if (!response.ok) {
    console.error("Erreur de réponse de users.php:", responseText);
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  
  try {
    const result = JSON.parse(responseText);
    return {
      ...result,
      success: true,
      identifiant_technique: userData.identifiant_technique
    };
  } catch (e) {
    console.log("Réponse non-JSON de users.php:", responseText);
    
    return {
      success: response.ok,
      message: "Opération terminée (réponse non-JSON)",
      identifiant_technique: userData.identifiant_technique
    };
  }
};
