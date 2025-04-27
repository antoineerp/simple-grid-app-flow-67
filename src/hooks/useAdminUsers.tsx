
import { useState, useEffect, useCallback } from 'react';
import { getUtilisateurs, invalidateUserCache, type Utilisateur } from '@/services';
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

  const loadUtilisateurs = useCallback(async () => {
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

    // Éviter de lancer plusieurs requêtes si une est déjà en cours
    if (loading) {
      console.log("Chargement déjà en cours, requête ignorée");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Début du chargement des utilisateurs...");
      
      // Récupérer les utilisateurs directement - la mise en cache est gérée dans le service
      const data = await getUtilisateurs();
      console.log("Données utilisateurs récupérées:", data);
      
      setUtilisateurs(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, loading]);

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
      // Simuler la connexion en tant qu'utilisateur (remplacer par une vraie API call si nécessaire)
      console.log(`Connexion en tant que: ${identifiantTechnique}`);
      localStorage.setItem('database_user', identifiantTechnique);
      
      // Invalider le cache des utilisateurs pour forcer un rechargement
      invalidateUserCache();
      
      toast({
        title: "Connexion réussie",
        description: `Vous êtes maintenant connecté en tant que ${identifiantTechnique}`,
      });
      
      return true;
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
