
// Importer les dépendances nécessaires
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

// Types
type LoginCredentials = {
  username: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: {
    id: number;
    identifiant_technique: string;
    role: string;
    nom: string;
    prenom: string;
    email: string;
  }
};

// Fonction pour obtenir l'URL de l'API
const API_URL = getApiUrl();

// Fonctions pour l'authentification
export const loginUser = async ({ username, password }: LoginCredentials): Promise<AuthResponse | null> => {
  try {
    console.log(`Tentative de connexion à ${API_URL}/auth.php avec l'identifiant: ${username}`);
    
    const response = await fetch(`${API_URL}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Erreur de connexion:', data);
      toast({
        title: "Échec de la connexion",
        description: data.message || "Vérifiez vos identifiants",
        variant: "destructive",
      });
      return null;
    }
    
    // Stocker le token dans le localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('isLoggedIn', 'true');
    
    // Stocker les informations utilisateur
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('userName', `${data.user.prenom} ${data.user.nom}`);
    localStorage.setItem('userId', data.user.id.toString());
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userIdentifiant', data.user.identifiant_technique);
    
    console.log('Connexion réussie pour:', username);
    
    toast({
      title: "Connexion réussie",
      description: `Bienvenue, ${data.user.prenom} ${data.user.nom}`,
    });
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la tentative de connexion:', error);
    toast({
      title: "Erreur de connexion",
      description: "Impossible de se connecter au serveur",
      variant: "destructive",
    });
    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userIdentifiant');
  
  console.log('Déconnexion réussie');
  
  toast({
    title: "Déconnecté",
    description: "Vous avez été déconnecté avec succès",
  });
  
  // Rediriger vers la page d'accueil
  window.location.href = '/';
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('authToken') !== null;
};

// Obtenir les en-têtes d'authentification pour les requêtes API
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Obtenir le rôle de l'utilisateur
export const getUserRole = (): string => {
  return localStorage.getItem('userRole') || '';
};

// Obtenir le nom de l'utilisateur
export const getUserName = (): string => {
  return localStorage.getItem('userName') || '';
};

// Obtenir l'ID de l'utilisateur
export const getUserId = (): string => {
  return localStorage.getItem('userId') || '';
};
