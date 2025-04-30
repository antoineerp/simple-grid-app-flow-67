
// Ajouter aux exports existants
export const getIsLoggedIn = (): boolean => {
  return Boolean(localStorage.getItem('authToken'));
};

export const getCurrentUser = (): any => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing current user data:', e);
    return null;
  }
};

interface AuthResult {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // Cette fonction simule une authentification pour les besoins de débogage
    console.log(`Tentative de connexion avec ${email}`);
    
    // Simuler un délai de connexion
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Accepter toute combinaison pour le débogage
    const user = {
      id: '1',
      email: email,
      role: 'admin',
      identifiant_technique: 'p71x6d_admin'
    };
    
    // Enregistrer l'utilisateur dans localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', 'fake-token-for-debug-purposes');
    
    return {
      success: true,
      token: 'fake-token-for-debug-purposes',
      user: user
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la connexion'
    };
  }
};

export const logout = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
