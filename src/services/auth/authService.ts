
// Obtenez l'ID de l'utilisateur actuel à partir du localStorage
export const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

// Utilisez cette fonction pour savoir si un utilisateur est connecté
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Récupérez des informations sur l'utilisateur actuel
export const getUserInfo = (): {id: string | null, role: string | null, username: string | null} => {
  return {
    id: localStorage.getItem('userId'),
    role: localStorage.getItem('userRole'),
    username: localStorage.getItem('username')
  };
};

// Déconnecter l'utilisateur
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
};
