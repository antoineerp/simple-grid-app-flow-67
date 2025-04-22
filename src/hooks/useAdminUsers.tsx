
import { useState, useEffect } from 'react';
import { getUtilisateurs, connectAsUser, testDatabaseConnection, type Utilisateur } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from '@/types/roles';

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUtilisateurs();
  }, []);

  const loadUtilisateurs = async () => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions avant de charger les utilisateurs
    if (!hasPermission(currentUserRole, 'accessAdminPanel')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour voir la liste des utilisateurs.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Vérifier d'abord la connexion à la base de données
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error("Impossible de se connecter à la base de données. Vérifiez la configuration.");
      }
      
      const data = await getUtilisateurs();
      setUtilisateurs(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAsUser = async (identifiantTechnique: string) => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions de connexion
    if (!hasPermission(currentUserRole, 'accessAdminPanel')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour changer d'utilisateur.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Vérifier d'abord la connexion à la base de données
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error("Impossible de se connecter à la base de données. Vérifiez la configuration.");
      }
      
      const success = await connectAsUser(identifiantTechnique);
      return success;
    } catch (error) {
      console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue lors de la connexion",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    utilisateurs,
    loading,
    error,
    loadUtilisateurs,
    handleConnectAsUser
  };
};
