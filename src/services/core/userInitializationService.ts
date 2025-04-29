
import { toast } from '@/hooks/use-toast';
import { getCurrentUser } from './databaseConnectionService';
import { getUtilisateurs, type Utilisateur } from '../users/userService';

/**
 * Service responsible for initializing user data when they first log in
 */
class UserInitializationService {
  private static instance: UserInitializationService;

  private constructor() {
    console.log("User initialization service initialized");
  }

  // Singleton pattern to get the instance
  public static getInstance(): UserInitializationService {
    if (!UserInitializationService.instance) {
      UserInitializationService.instance = new UserInitializationService();
    }
    return UserInitializationService.instance;
  }

  /**
   * Check if the user data needs to be initialized
   * @returns True if data needs initialization, false otherwise
   */
  public needsInitialization(userId: string): boolean {
    // Check if the user has documents data
    const hasDocuments = localStorage.getItem(`documents_${userId}`) !== null;
    
    // Check if the user has exigences data
    const hasExigences = localStorage.getItem(`exigences_${userId}`) !== null;
    
    // If either is missing, initialization is needed
    return !hasDocuments || !hasExigences;
  }

  /**
   * Initialize user data by copying templates from gestionnaire or using defaults
   * @param userId The user ID to initialize
   * @returns True if successful, false otherwise
   */
  public async initializeUserData(userId: string): Promise<boolean> {
    try {
      console.log(`Initializing data for user: ${userId}`);
      
      // Tenter d'initialiser à partir d'un gestionnaire d'abord
      const initializedFromManager = await this.initializeFromManager(userId);
      
      if (!initializedFromManager) {
        console.log("Aucune donnée de gestionnaire trouvée, initialisation avec les valeurs par défaut");
        // Initialize documents if needed
        if (!localStorage.getItem(`documents_${userId}`)) {
          this.initializeDocuments(userId);
        }
        
        // Initialize exigences if needed
        if (!localStorage.getItem(`exigences_${userId}`)) {
          this.initializeExigences(userId);
        }
      }
      
      toast({
        title: "Données initialisées",
        description: "Vos données ont été configurées avec succès",
      });
      
      return true;
    } catch (error) {
      console.error("Error initializing user data:", error);
      toast({
        title: "Erreur d'initialisation",
        description: "Impossible d'initialiser vos données",
        variant: "destructive",
      });
      return false;
    }
  }

  /**
   * Tente d'initialiser les données d'un utilisateur à partir d'un gestionnaire
   */
  private async initializeFromManager(userId: string): Promise<boolean> {
    try {
      // Récupérer la liste des utilisateurs pour trouver un gestionnaire
      const users = await getUtilisateurs();
      const manager = users.find(user => user.role === 'gestionnaire');
      
      if (!manager) {
        console.log("Aucun gestionnaire trouvé pour l'initialisation");
        return false;
      }
      
      console.log(`Gestionnaire trouvé: ${manager.prenom} ${manager.nom}`);
      const managerId = manager.identifiant_technique;
      
      // Copier les documents du gestionnaire
      const managerDocuments = localStorage.getItem(`documents_${managerId}`);
      if (managerDocuments) {
        localStorage.setItem(`documents_${userId}`, managerDocuments);
        console.log("Documents copiés du gestionnaire");
      }
      
      // Copier les exigences du gestionnaire
      const managerExigences = localStorage.getItem(`exigences_${managerId}`);
      if (managerExigences) {
        localStorage.setItem(`exigences_${userId}`, managerExigences);
        console.log("Exigences copiées du gestionnaire");
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'initialisation depuis le gestionnaire:", error);
      return false;
    }
  }

  /**
   * Initialize documents for a user
   */
  private initializeDocuments(userId: string): void {
    // Try to get the template from admin
    const templateDocuments = localStorage.getItem('documents_template');
    
    if (templateDocuments) {
      // Use the template if available
      localStorage.setItem(`documents_${userId}`, templateDocuments);
      console.log(`Documents initialized from template for user ${userId}`);
    } else {
      // Create default documents if no template exists
      const defaultDocuments = [
        { 
          id: '1', 
          nom: 'Document 1',
          fichier_path: 'Voir le document',
          responsabilites: { r: [], a: [], c: [], i: [] },
          etat: 'C',
          date_creation: new Date(),
          date_modification: new Date()
        },
        { 
          id: '2', 
          nom: 'Document 2',
          fichier_path: null,
          responsabilites: { r: [], a: [], c: [], i: [] },
          etat: 'PC',
          date_creation: new Date(),
          date_modification: new Date()
        },
        { 
          id: '3', 
          nom: 'Document 3',
          fichier_path: 'Voir le document',
          responsabilites: { r: [], a: [], c: [], i: [] },
          etat: 'NC',
          date_creation: new Date(),
          date_modification: new Date()
        },
      ];
      
      localStorage.setItem(`documents_${userId}`, JSON.stringify(defaultDocuments));
      console.log(`Default documents created for user ${userId}`);
    }
  }

  /**
   * Initialize exigences for a user
   */
  private initializeExigences(userId: string): void {
    // Try to get the template from admin
    const templateExigences = localStorage.getItem('exigences_template');
    
    if (templateExigences) {
      // Use the template if available
      localStorage.setItem(`exigences_${userId}`, templateExigences);
      console.log(`Exigences initialized from template for user ${userId}`);
    } else {
      // Create default exigences if no template exists
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
      console.log(`Default exigences created for user ${userId}`);
    }
  }
  
  /**
   * Permet à un administrateur de récupérer manuellement les données du gestionnaire
   */
  public async adminImportFromManager(): Promise<boolean> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error("Aucun utilisateur connecté");
        return false;
      }
      
      // Vérifier si l'utilisateur est admin
      const users = await getUtilisateurs();
      const currentUserDetails = users.find(user => user.identifiant_technique === currentUser);
      
      if (!currentUserDetails || currentUserDetails.role !== 'admin') {
        console.error("Seul un administrateur peut effectuer cette opération");
        return false;
      }
      
      // Récupérer le gestionnaire
      const manager = users.find(user => user.role === 'gestionnaire');
      
      if (!manager) {
        console.error("Aucun gestionnaire trouvé");
        return false;
      }
      
      // Copier les données du gestionnaire
      const managerDocuments = localStorage.getItem(`documents_${manager.identifiant_technique}`);
      const managerExigences = localStorage.getItem(`exigences_${manager.identifiant_technique}`);
      
      if (managerDocuments) {
        localStorage.setItem(`documents_${currentUser}`, managerDocuments);
      }
      
      if (managerExigences) {
        localStorage.setItem(`exigences_${currentUser}`, managerExigences);
      }
      
      toast({
        title: "Données importées",
        description: "Les données du gestionnaire ont été importées avec succès",
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'importation des données du gestionnaire:", error);
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'importer les données du gestionnaire",
        variant: "destructive",
      });
      return false;
    }
  }
}

// Export the user initialization service instance
const userInitService = UserInitializationService.getInstance();

// Export simplified functions for easier usage
export const needsInitialization = (userId: string): boolean => {
  return userInitService.needsInitialization(userId);
};

export const initializeUserData = (userId: string): Promise<boolean> => {
  return userInitService.initializeUserData(userId);
};

export const adminImportFromManager = (): Promise<boolean> => {
  return userInitService.adminImportFromManager();
};
