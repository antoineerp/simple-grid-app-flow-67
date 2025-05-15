
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Initialises user data on login
 */
export const initializeUserData = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Initialisation des données pour l'utilisateur ${userId}`);
    
    // Vérifier si les données existent déjà
    const hasExistingData = checkExistingUserData(userId);
    
    if (hasExistingData) {
      console.log(`L'utilisateur ${userId} a déjà des données initialisées`);
      return true;
    }
    
    // Créer les structures de données pour l'utilisateur
    await createUserDataStructures(userId);
    
    toast({
      title: "Données initialisées",
      description: "Vos données ont été initialisées avec succès"
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données utilisateur:", error);
    toast({
      title: "Erreur d'initialisation",
      description: "Impossible d'initialiser vos données",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Check if user already has data
 */
const checkExistingUserData = (userId: string): boolean => {
  return !!(
    localStorage.getItem(`membres_${userId}`) ||
    localStorage.getItem(`documents_${userId}`) ||
    localStorage.getItem(`exigences_${userId}`) ||
    localStorage.getItem(`pilotage_${userId}`) ||
    localStorage.getItem(`bibliotheque_${userId}`)
  );
};

/**
 * Create all necessary data structures for a new user
 */
const createUserDataStructures = async (userId: string): Promise<void> => {
  console.log(`Création des structures de données pour l'utilisateur ${userId}`);
  
  const userRole = localStorage.getItem('userRole');
  
  // Source des données par défaut
  let sourceMembres, sourceDocuments, sourceExigences, sourcePilotage, sourceBibliotheque;
  
  // Essayer de trouver un gestionnaire ou administrateur pour copier ses données
  const users = getAllLocalUsers();
  
  for (const user of users) {
    const role = localStorage.getItem(`role_${user}`);
    if (role === 'gestionnaire' || role === 'administrateur' || role === 'admin') {
      console.log(`Utilisation des données de l'utilisateur ${user} (${role}) comme source`);
      
      // Copier les données de l'utilisateur source
      sourceMembres = localStorage.getItem(`membres_${user}`);
      sourceDocuments = localStorage.getItem(`documents_${user}`);
      sourceExigences = localStorage.getItem(`exigences_${user}`);
      sourcePilotage = localStorage.getItem(`pilotage_${user}`);
      sourceBibliotheque = localStorage.getItem(`bibliotheque_${user}`);
      
      break;
    }
  }
  
  // Si aucune source trouvée, utiliser les templates
  if (!sourceMembres) sourceMembres = localStorage.getItem(`membres_template`);
  if (!sourceDocuments) sourceDocuments = localStorage.getItem(`documents_template`);
  if (!sourceExigences) sourceExigences = localStorage.getItem(`exigences_template`);
  if (!sourcePilotage) sourcePilotage = localStorage.getItem(`pilotage_template`);
  if (!sourceBibliotheque) sourceBibliotheque = localStorage.getItem(`bibliotheque_template`);
  
  // Initialiser les données de l'utilisateur
  if (sourceMembres) {
    localStorage.setItem(`membres_${userId}`, sourceMembres);
  } else {
    // Données par défaut pour les membres
    const defaultMembres = [
      { 
        id: '1', 
        nom: 'Dupont',
        prenom: 'Jean',
        fonction: 'Directeur',
        initiales: 'JD',
        date_creation: new Date(),
        mot_de_passe: '' 
      },
      { 
        id: '2', 
        nom: 'Martin',
        prenom: 'Sophie',
        fonction: 'Qualité',
        initiales: 'SM',
        date_creation: new Date(),
        mot_de_passe: ''
      },
    ];
    localStorage.setItem(`membres_${userId}`, JSON.stringify(defaultMembres));
  }
  
  if (sourceDocuments) {
    localStorage.setItem(`documents_${userId}`, sourceDocuments);
  } else {
    // Données par défaut pour les documents
    const defaultDocuments = [
      { 
        id: '1', 
        nom: 'Manuel qualité', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Processus opérationnel', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
    localStorage.setItem(`documents_${userId}`, JSON.stringify(defaultDocuments));
  }
  
  if (sourceExigences) {
    localStorage.setItem(`exigences_${userId}`, sourceExigences);
  } else {
    // Données par défaut pour les exigences
    const defaultExigences = [
      { 
        id: '1', 
        nom: 'Levée du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Ouverture du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
    localStorage.setItem(`exigences_${userId}`, JSON.stringify(defaultExigences));
  }
  
  if (sourcePilotage) {
    localStorage.setItem(`pilotage_${userId}`, sourcePilotage);
  } else {
    // Données par défaut pour le pilotage
    const defaultPilotage = [
      { 
        id: '1', 
        nom: 'Politique qualité', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
      { 
        id: '2', 
        nom: 'Plan d\'action', 
        fichier_path: null,
        responsabilites: { r: [], a: [], c: [], i: [] },
        etat: null,
        date_creation: new Date(),
        date_modification: new Date()
      },
    ];
    localStorage.setItem(`pilotage_${userId}`, JSON.stringify(defaultPilotage));
  }
  
  if (sourceBibliotheque) {
    localStorage.setItem(`bibliotheque_${userId}`, sourceBibliotheque);
  } else {
    // Données par défaut pour la bibliothèque
    const defaultBibliotheque = [
      { 
        id: '1', 
        titre: 'Manuel qualité', 
        fichier_path: null,
        categorie: 'Document',
        date_creation: new Date(),
        date_modification: new Date()
      }
    ];
    localStorage.setItem(`bibliotheque_${userId}`, JSON.stringify(defaultBibliotheque));
  }
  
  // Stocker le rôle de l'utilisateur pour référence future
  localStorage.setItem(`role_${userId}`, userRole || 'utilisateur');
};

/**
 * Get all local users
 */
const getAllLocalUsers = (): string[] => {
  const users: string[] = [];
  
  // Parcourir le localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Si la clé correspond à un utilisateur (format: membres_[user])
    if (key && key.startsWith('membres_') && key !== 'membres_template') {
      const user = key.replace('membres_', '');
      users.push(user);
    }
  }
  
  return users;
};

/**
 * Import data from manager user to admin
 */
export const adminImportFromManager = async (): Promise<boolean> => {
  try {
    console.log("Import des données du gestionnaire vers l'administrateur");
    
    // Trouver l'utilisateur gestionnaire
    const users = getAllLocalUsers();
    let managerUser = null;
    
    for (const user of users) {
      const role = localStorage.getItem(`role_${user}`);
      if (role === 'gestionnaire') {
        managerUser = user;
        break;
      }
    }
    
    if (!managerUser) {
      console.error("Aucun utilisateur gestionnaire trouvé");
      return false;
    }
    
    // Obtenir l'utilisateur administrateur actuel
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error("Aucun utilisateur connecté");
      return false;
    }
    
    // Copier les données du gestionnaire vers l'administrateur
    const membreData = localStorage.getItem(`membres_${managerUser}`);
    const documentsData = localStorage.getItem(`documents_${managerUser}`);
    const exigencesData = localStorage.getItem(`exigences_${managerUser}`);
    const pilotageData = localStorage.getItem(`pilotage_${managerUser}`);
    const bibliothequeData = localStorage.getItem(`bibliotheque_${managerUser}`);
    
    if (membreData) localStorage.setItem(`membres_${currentUser}`, membreData);
    if (documentsData) localStorage.setItem(`documents_${currentUser}`, documentsData);
    if (exigencesData) localStorage.setItem(`exigences_${currentUser}`, exigencesData);
    if (pilotageData) localStorage.setItem(`pilotage_${currentUser}`, pilotageData);
    if (bibliothequeData) localStorage.setItem(`bibliotheque_${currentUser}`, bibliothequeData);
    
    // Mettre à jour les templates
    if (membreData) localStorage.setItem('membres_template', membreData);
    if (documentsData) localStorage.setItem('documents_template', documentsData);
    if (exigencesData) localStorage.setItem('exigences_template', exigencesData);
    if (pilotageData) localStorage.setItem('pilotage_template', pilotageData);
    if (bibliothequeData) localStorage.setItem('bibliotheque_template', bibliothequeData);
    
    // Synchronisation avec le serveur pour l'administrateur
    // Vous pourriez appeler vos fonctions de synchronisation ici
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'importation des données du gestionnaire:", error);
    return false;
  }
};
