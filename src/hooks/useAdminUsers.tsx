
import { useState } from 'react';
import { getUtilisateurs, connectAsUser, type Utilisateur } from '@/services';
import { useToast } from "@/hooks/use-toast";

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadUtilisateurs = async () => {
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
