
import { toast } from "@/hooks/use-toast";
import { connectAsUser } from './database';

/**
 * Service responsible for initializing user data when they first log in
 */

export const initializeUserData = async (userId: string): Promise<void> => {
  console.log("Initializing user data for:", userId);
  
  try {
    // Connect to the user's database
    const connected = await connectAsUser(userId);
    
    if (!connected) {
      console.error("Failed to connect to user database:", userId);
      return;
    }
    
    toast({
      title: "Initialisation réussie",
      description: "Vos données ont été chargées avec succès",
    });
  } catch (error) {
    console.error("Error initializing user data:", error);
    toast({
      title: "Erreur d'initialisation",
      description: "Impossible de charger vos données",
      variant: "destructive",
    });
  }
};
