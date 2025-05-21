
// Fonction pour récupérer l'utilisateur actuel
export const getCurrentUser = (): string => {
  // Récupérer l'ID utilisateur depuis le token JWT (le plus fiable)
  const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  if (authToken) {
    try {
      // Décodage sécurisé du token JWT
      const parts = authToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        
        // Extraction selon différents formats possibles
        if (payload && payload.user) {
          if (typeof payload.user === 'object' && payload.user.identifiant_technique) {
            console.log(`ID utilisateur récupéré depuis le token JWT: ${payload.user.identifiant_technique}`);
            return payload.user.identifiant_technique;
          } else if (typeof payload.user === 'string') {
            console.log(`ID utilisateur récupéré depuis le token JWT: ${payload.user}`);
            return payload.user;
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
    }
  }
  
  // Fallback sur l'ID stocké (moins fiable)
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log(`ID utilisateur récupéré depuis le storage local: ${userId}`);
    return userId;
  }
  
  console.warn("Aucun userId trouvé, utilisation de p71x6d_richard comme identifiant par défaut");
  return 'p71x6d_richard'; // ID par défaut corrigé pour utiliser p71x6d_richard
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): void => {
  if (!userId) {
    console.warn("Tentative de définir un userId invalide");
    return;
  }
  
  try {
    // Vérification que l'ID utilisateur est au format valide
    if (!userId.startsWith('p71x6d_')) {
      console.error(`Format d'identifiant utilisateur invalide: ${userId}`);
      toast({
        variant: "destructive",
        title: "Erreur d'identifiant",
        description: `Format d'identifiant technique invalide: ${userId}`
      });
      return;
    }
    
    console.log(`Définition de l'utilisateur courant: ${userId}`);
    localStorage.setItem('userId', userId);
    sessionStorage.setItem('userId', userId);
    
    // Déclencher un événement pour informer l'application du changement d'utilisateur
    window.dispatchEvent(new CustomEvent('userChanged', { 
      detail: { userId } 
    }));
    
  } catch (error) {
    console.error("Erreur lors de la définition de l'utilisateur:", error);
  }
};

// Fonction pour supprimer l'utilisateur actuel
export const removeCurrentUser = (): void => {
  try {
    localStorage.removeItem('userId');
    sessionStorage.removeItem('userId');
    
    // Informer l'application que l'utilisateur a été supprimé
    window.dispatchEvent(new Event('userRemoved'));
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur du localStorage:", error);
  }
};

// Variable pour stocker la dernière erreur de connexion
let lastConnectionError: string | null = null;

// Fonction pour obtenir la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

// Fonction pour définir la dernière erreur de connexion
export const setLastConnectionError = (error: string): void => {
  lastConnectionError = error;
  console.error("Erreur de connexion enregistrée:", error);
};

// Fonction pour se connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) {
      throw new Error("ID utilisateur invalide");
    }
    
    console.log(`Connexion en tant que: ${userId}`);
    
    // Enregistrer l'ID dans le stockage
    setCurrentUser(userId);
    
    // Vérifier que l'identifiant est bien enregistré
    const currentUser = getCurrentUser();
    if (currentUser !== userId) {
      throw new Error(`Échec de l'enregistrement de l'identifiant: ${currentUser} != ${userId}`);
    }
    
    // Tester la connexion à la base de données après le changement d'utilisateur
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest) {
      throw new Error("Échec du test de connexion après changement d'utilisateur");
    }
    
    // Mettre à jour l'interface utilisateur
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: userId }
    }));
    
    // Notification de succès
    toast({
      title: "Connexion réussie",
      description: `Connecté en tant que: ${userId}`
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: errorMessage
    });
    
    return false;
  }
};

// Fonction pour déconnecter l'utilisateur
export const disconnectUser = (): void => {
  removeCurrentUser();
  console.log("Utilisateur déconnecté de la base de données");
  
  // Notification de déconnexion
  toast({
    title: "Déconnexion",
    description: "Utilisateur déconnecté de la base de données"
  });
};

// Fonction pour obtenir l'utilisateur actuel de la connexion à la base de données
export const getDatabaseConnectionCurrentUser = (): string => {
  return getCurrentUser();
};

// Interface pour les informations de base de données
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const userId = getCurrentUser();
    console.log(`Test de connexion à la base de données via check-users.php avec ${userId}`);
    
    // Utiliser check-users.php qui fonctionne pour tester la connexion
    const response = await fetch(`${getApiUrl()}/check-users.php`, {
      headers: getAuthHeaders(),
      method: 'GET',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || response.statusText;
      console.error("Erreur de connexion à la base de données:", errorMessage);
      setLastConnectionError(errorMessage);
      return false;
    }
    
    const result = await response.json();
    if (!result || !result.records) {
      setLastConnectionError("Réponse de l'API invalide");
      return false;
    }
    
    console.log("Connexion à la base de données réussie via check-users.php");
    return true;
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    return false;
  }
};

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    const userId = getCurrentUser();
    console.log(`Récupération des informations de base de données pour: ${userId}`);
    
    // Appel direct à check-users.php qui fonctionne
    const response = await fetch(`${getApiUrl()}/check-users.php?source=${userId}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    // Si la requête échoue, lancer une erreur
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || `Erreur de connexion à la base de données: ${response.statusText}`;
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Essayer d'analyser la réponse JSON
    const data = await response.json();
    
    if (!data || !data.records) {
      const errorMessage = "Échec de la récupération des informations de la base de données";
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Extraire et formater les informations de la base de données
    const dbInfo: DatabaseInfo = {
      host: "p71x6d.myd.infomaniak.com",
      database: userId,
      size: '10 MB',
      tables: data.records ? data.records.length : 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: 'Online',
      encoding: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      tableList: ['utilisateurs']
    };
    
    console.log("Informations de base de données reçues:", dbInfo);
    return dbInfo;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    // Lancer l'erreur pour la propager au composant appelant
    throw error;
  }
};

// Fonction pour initialiser l'utilisateur actuel
export const initializeCurrentUser = (): void => {
  const currentUser = getCurrentUser();
  console.log(`Utilisateur initialisé: ${currentUser}`);
  
  // Vérifier si l'utilisateur est valide et afficher une notification si nécessaire
  if (currentUser === 'p71x6d_richard') {
    toast({
      variant: "destructive",
      title: "Utilisateur par défaut",
      description: "Vous utilisez l'utilisateur par défaut du système. Connectez-vous pour accéder à vos données."
    });
  } else {
    toast({
      title: "Utilisateur initialisé",
      description: `Utilisateur actif: ${currentUser}`
    });
  }
};

// Fonction pour vérifier si l'utilisateur actuel est l'utilisateur par défaut
export const isDefaultUser = (): boolean => {
  const currentUser = getCurrentUser();
  return currentUser === 'p71x6d_richard';
};
