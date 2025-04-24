
import { toast } from '@/hooks/use-toast';
import { getCurrentUser } from './databaseConnectionService';

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
   * Initialize user data by copying templates from admin or using defaults
   * @param userId The user ID to initialize
   * @returns True if successful, false otherwise
   */
  public async initializeUserData(userId: string): Promise<boolean> {
    try {
      console.log(`Initializing data for user: ${userId}`);
      
      // Initialize documents if needed
      if (!localStorage.getItem(`documents_${userId}`)) {
        this.initializeDocuments(userId);
      }
      
      // Initialize exigences if needed
      if (!localStorage.getItem(`exigences_${userId}`)) {
        this.initializeExigences(userId);
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
