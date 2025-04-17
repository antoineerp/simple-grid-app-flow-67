
import { toast } from '@/hooks/use-toast';

// Types pour les utilisateurs
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Toujours stocké haché
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

// Type pour les informations de la base de données
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
}

// Configuration de la connexion à la base de données
// Ces informations ne devraient idéalement pas être exposées côté client
// et devraient être gérées par un backend sécurisé
const DB_CONFIG = {
  host: 'p71x6d.myd.infomaniak.com',
  port: 3306,
  database: 'p71x6d_system',
  user: 'p71x6d_system',
  password: 'Trottinette43!'
};

// Classe pour gérer les connexions et les requêtes à la base de données
class DatabaseService {
  private static instance: DatabaseService;
  private currentUser: string | null = null;

  private constructor() {
    // Constructeur privé pour le singleton
    console.log("Service de base de données initialisé");
  }

  // Méthode pour obtenir l'instance du service (singleton)
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Définir l'utilisateur actuel connecté
  public setCurrentUser(identifiantTechnique: string | null): void {
    this.currentUser = identifiantTechnique;
    if (identifiantTechnique) {
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      console.log(`Utilisateur connecté à la base de données: ${identifiantTechnique}`);
    } else {
      localStorage.removeItem('currentDatabaseUser');
      console.log('Utilisateur déconnecté de la base de données');
    }
  }

  // Obtenir l'utilisateur actuel
  public getCurrentUser(): string | null {
    if (!this.currentUser) {
      this.currentUser = localStorage.getItem('currentDatabaseUser');
    }
    return this.currentUser;
  }

  // Cette fonction récupère les utilisateurs depuis la base de données
  async getUtilisateurs(): Promise<Utilisateur[]> {
    try {
      // Dans une application réelle, cette requête devrait être effectuée par un backend
      console.log("Récupération des utilisateurs de la base de données...");
      
      // Simulons la récupération des utilisateurs (à remplacer par une vraie requête API)
      // Dans un vrai cas, on appellerait une API backend qui effectuerait la requête SQL sécurisée
      return [
        {
          id: 1,
          nom: "Cirier",
          prenom: "Antoine",
          email: "antcirier@gmail.com",
          mot_de_passe: "****", // On ne renvoie jamais les mots de passe en clair
          identifiant_technique: "p71x6d_system",
          role: "admin",
          date_creation: "2025-03-31 16:10:09"
        },
        {
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_dupont",
          role: "utilisateur",
          date_creation: "2025-04-01 10:15:00"
        },
        {
          id: 3,
          nom: "Martin",
          prenom: "Sophie",
          email: "sophie.martin@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_martin",
          role: "gestionnaire",
          date_creation: "2025-04-02 14:30:00"
        }
      ];
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer les utilisateurs depuis la base de données.",
        variant: "destructive",
      });
      return [];
    }
  }

  // Fonction pour se connecter à la base de données en tant qu'utilisateur
  async connectAsUser(identifiantTechnique: string): Promise<boolean> {
    try {
      console.log(`Tentative de connexion en tant que ${identifiantTechnique}...`);
      
      // Dans une application réelle, cette authentification passerait par un backend
      // qui vérifierait les identifiants et renverrait un token d'authentification
      
      // Simuler une connexion réussie
      this.setCurrentUser(identifiantTechnique);
      
      toast({
        title: "Connexion réussie",
        description: `Vous êtes maintenant connecté en tant que ${identifiantTechnique}`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast({
        title: "Échec de la connexion",
        description: "Impossible de se connecter avec cet identifiant.",
        variant: "destructive",
      });
      return false;
    }
  }

  // Fonction pour obtenir les informations de la base de données
  async getDatabaseInfo(): Promise<DatabaseInfo | null> {
    try {
      console.log("Récupération des informations de la base de données...");
      
      // Dans une application réelle, ces informations viendraient d'une API backend
      return {
        host: DB_CONFIG.host,
        database: DB_CONFIG.database,
        size: "125 MB", // Taille simulée
        tables: 10, // Nombre simulé
        lastBackup: "2025-04-17 08:00:00", // Date simulée
        status: "Online"
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des informations de la base de données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations de la base de données.",
        variant: "destructive",
      });
      return null;
    }
  }

  // Fonction pour déconnecter l'utilisateur actuel
  disconnectUser(): void {
    this.setCurrentUser(null);
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de la base de données.",
    });
  }

  // Pour tester la connexion à la base de données
  async testConnection(): Promise<boolean> {
    try {
      console.log("Test de connexion à la base de données...");
      // Dans un environnement réel, on appellerait une API pour tester la connexion
      
      // Simuler un test réussi
      toast({
        title: "Connexion réussie",
        description: `Connexion établie avec ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`,
      });
      
      return true;
    } catch (error) {
      console.error("Erreur lors du test de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible d'établir une connexion à la base de données.",
        variant: "destructive",
      });
      return false;
    }
  }
}

// Instance du service de base de données
const dbService = DatabaseService.getInstance();

// Exportation des fonctions du service pour une utilisation simplifiée
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return dbService.getUtilisateurs();
};

export const connectAsUser = (identifiantTechnique: string): Promise<boolean> => {
  return dbService.connectAsUser(identifiantTechnique);
};

export const getDatabaseInfo = (): Promise<DatabaseInfo | null> => {
  return dbService.getDatabaseInfo();
};

export const disconnectUser = (): void => {
  dbService.disconnectUser();
};

export const getCurrentUser = (): string | null => {
  return dbService.getCurrentUser();
};

export const testDatabaseConnection = (): Promise<boolean> => {
  return dbService.testConnection();
};

