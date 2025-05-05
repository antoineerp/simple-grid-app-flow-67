
import { useState, useEffect } from 'react';
import { getUtilisateurs, Utilisateur } from '@/services/users/userService';
import { useToast } from '@/hooks/use-toast';

export const useUsers = () => {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getUtilisateurs();
        setUsers(data);
        setError(null);
      } catch (e) {
        console.error("Erreur lors de la récupération des utilisateurs:", e);
        setError(e instanceof Error ? e.message : "Une erreur est survenue lors du chargement des utilisateurs");
        toast({
          title: "Erreur",
          description: "Impossible de récupérer la liste des utilisateurs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  return { users, loading, error };
};
