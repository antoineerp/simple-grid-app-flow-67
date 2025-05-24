
import { LoginResponse } from '@/types/auth';
import { getApiUrl } from '@/config/apiConfig';

export const getIsLoggedIn = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const checkAuth = (): boolean => {
  return getIsLoggedIn();
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  localStorage.removeItem('currentDatabaseUser');
};

// Fonction de login améliorée pour gérer les erreurs et essayer différentes routes
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
    const API_URL = getApiUrl();
    
    // Essayer d'abord login-test.php qui est plus fiable pour les tests
    let response;
    let error = null;
    let usedEndpoint = '';
    
    try {
      console.log("Essai avec login-test.php");
      usedEndpoint = `${API_URL}/login-test.php`;
      response = await fetch(usedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
    } catch (e) {
      error = e;
      console.error("Erreur avec login-test.php:", e);
      
      // En cas d'échec, essayer avec /api/auth.php
      try {
        console.log("Essai avec auth.php");
        usedEndpoint = `${API_URL}/auth.php`;
        response = await fetch(usedEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
      } catch (e2) {
        error = e2;
        console.error("Erreur avec auth.php:", e2);
        
        // Dernier essai avec login.php
        try {
          console.log("Essai avec login.php");
          usedEndpoint = `${API_URL}/login.php`;
          response = await fetch(usedEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          });
        } catch (e3) {
          error = e3;
          console.error("Erreur avec login.php:", e3);
          throw new Error("Tous les endpoints d'authentification ont échoué");
        }
      }
    }
    
    if (!response) {
      throw error || new Error("Aucune réponse reçue du serveur");
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP (${response.status}) de ${usedEndpoint}:`, errorText);
      
      // Vérifier si le texte contient du PHP non exécuté
      if (errorText.includes('<?php')) {
        return {
          success: false,
          message: `Le serveur PHP ne fonctionne pas correctement (${response.status}). Veuillez vérifier la configuration du serveur.`,
        };
      }
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: `Erreur HTTP ${response.status} avec le texte : ${errorText.substring(0, 100)}...` };
      }
      
      return {
        success: false,
        message: errorData.message || `Erreur HTTP ${response.status}`,
      };
    }

    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (responseText.includes('<?php')) {
      console.error("Réponse PHP non exécutée:", responseText.substring(0, 100));
      return {
        success: false,
        message: "Le serveur renvoie du code PHP au lieu de JSON. Vérifiez la configuration du serveur.",
      };
    }
    
    // Essayer de parser les données JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e, "Texte reçu:", responseText.substring(0, 300));
      return {
        success: false,
        message: "Format de réponse invalide. Le serveur n'a pas renvoyé de JSON valide.",
      };
    }
    
    if (data.success && data.token) {
      // Store token and user information
      localStorage.setItem('authToken', data.token);
      
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        if (data.user.identifiant_technique) {
          localStorage.setItem('currentDatabaseUser', data.user.identifiant_technique);
          console.log(`Utilisateur connecté: ${data.user.identifiant_technique}`);
        }
        
        if (data.user.role) {
          localStorage.setItem('userRole', data.user.role);
        }
      }
      
      console.log("Connexion réussie avec les données:", data);
    } else {
      console.warn("La réponse ne contient pas de token ou indique un échec:", data);
    }
    
    return data;
  } catch (error) {
    console.error("Exception lors de la connexion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Une erreur s'est produite lors de la connexion",
    };
  }
};

// Export as a complete service object
export const authService = {
  getIsLoggedIn,
  checkAuth,
  getAuthHeaders,
  getCurrentUser,
  logout,
  login,
};

// Export for backward compatibility
export default authService;
