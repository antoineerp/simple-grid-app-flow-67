
import { useState } from 'react';
import { getUtilisateurs, connectAsUser, type Utilisateur } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from '@/types/roles';

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  
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
    try {
      const data = await getUtilisateurs();
      setUtilisateurs(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
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

    const success = await connectAsUser(identifiantTechnique);
    return success;
  };

  return {
    utilisateurs,
    loading,
    loadUtilisateurs,
    handleConnectAsUser
  };
};
