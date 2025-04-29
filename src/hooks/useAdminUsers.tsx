
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Utilisateur, getUtilisateurs } from '@/services/users/userService';

export interface UserFormData {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  role: 'administrateur' | 'utilisateur' | 'gestionnaire';
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [currentUser, setCurrentUser] = useState<UserFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les utilisateurs depuis l'API
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedUsers = await getUtilisateurs();
      
      if (Array.isArray(loadedUsers)) {
        console.log("Utilisateurs chargés:", loadedUsers);
        setUsers(loadedUsers as Utilisateur[]);
      } else {
        console.error("Format de données inattendu:", loadedUsers);
        setError("Format de données inattendu");
        toast({
          title: "Erreur de chargement",
          description: "Le format des données utilisateurs est incorrect",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger les utilisateurs");
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialisation
  useEffect(() => {
    loadUsers();
  }, []);

  // Gérer l'édition d'un utilisateur
  const handleEditUser = (user: Utilisateur) => {
    setCurrentUser({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      mot_de_passe: '',
      role: user.role,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Gérer l'ouverture du formulaire d'ajout
  const handleAddUser = () => {
    setCurrentUser({
      nom: '',
      prenom: '',
      email: '',
      mot_de_passe: '',
      role: 'utilisateur',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Gérer le changement dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        [name]: value,
      });
    }
  };

  // Créer ou mettre à jour un utilisateur
  const handleSaveUser = async () => {
    // Cette fonction serait implémentée pour envoyer les données au serveur
    // Pour l'instant, nous simulons simplement une réponse réussie
    try {
      setIsLoading(true);
      
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isEditing && currentUser?.id) {
        // Mettre à jour l'utilisateur localement (pour la démo)
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === currentUser.id 
              ? { ...user, ...currentUser, mot_de_passe: '******' } as Utilisateur
              : user
          )
        );
        toast({
          title: "Utilisateur mis à jour",
          description: "L'utilisateur a été mis à jour avec succès",
        });
      } else {
        // Créer un nouvel utilisateur localement (pour la démo)
        const newUser: Utilisateur = {
          ...(currentUser as UserFormData),
          id: `${Date.now()}`,
          mot_de_passe: '******',
          identifiant_technique: `p71x6d_${currentUser?.nom?.toLowerCase() || 'user'}`,
          date_creation: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        toast({
          title: "Utilisateur créé",
          description: "Le nouvel utilisateur a été créé avec succès",
        });
      }
      
      // Fermer le modal
      setIsModalOpen(false);
      
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'utilisateur:", err);
      toast({
        title: "Erreur d'enregistrement",
        description: "Une erreur est survenue lors de l'enregistrement de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la suppression d'un utilisateur
  const handleDeleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Supprimer l'utilisateur localement (pour la démo)
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      toast({
        title: "Erreur de suppression",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    users,
    currentUser,
    isLoading,
    isEditing,
    isModalOpen,
    error,
    setIsModalOpen,
    handleEditUser,
    handleAddUser,
    handleInputChange,
    handleSaveUser,
    handleDeleteUser,
    loadUsers
  };
};

export default useAdminUsers;
