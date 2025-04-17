
import { toast } from '@/hooks/use-toast';

// Configuration de la connexion à la base de données
const DB_CONFIG = {
  host: 'p71x6d.myd.infomaniak.com',
  port: 3306,
  database: 'p71x6d_system',
  user: 'p71x6d_system',
  password: 'Trottinette43!'
};

// Types pour les utilisateurs
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

// Cette fonction simule une récupération des utilisateurs depuis la base de données
// En réalité, vous aurez besoin d'un backend pour faire cette requête
export const getUtilisateurs = async (): Promise<Utilisateur[]> => {
  try {
    // Dans une application réelle, cette requête devrait être effectuée par un backend
    // car les informations de connexion à la base de données ne doivent pas être exposées côté client
    console.log("Tentative de récupération des utilisateurs...");
    
    // Comme nous n'avons pas de backend, retournons un utilisateur de test
    // simulant celui que nous voyons dans la capture d'écran
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
};

// Fonction pour se connecter à la base de données en tant qu'utilisateur
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion en tant que ${identifiantTechnique}...`);
    
    // Simuler une connexion réussie
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
};

// Fonction pour obtenir les informations de la base de données
export const getDatabaseInfo = async () => {
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
};
