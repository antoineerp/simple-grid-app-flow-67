
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { checkPermission, UserRole } from '@/types/roles';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getUtilisateurs, ensureAllUserTablesExist, clearUsersCache } from '@/services/users/userManager';
import type { Utilisateur } from '@/types/auth';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

export const useAdminUsers = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Charger les utilisateurs au montage du composant avec retry
  useEffect(() => {
    loadUtilisateurs();
    
    // Si erreur, réessayer après 2 secondes (max 3 tentatives)
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Tentative de reconnexion (${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        loadUtilisateurs();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const loadUtilisateurs = useCallback(async () => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions avant de charger les utilisateurs
    if (!checkPermission(currentUserRole, 'isAdmin')) {
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
      console.log("Début du chargement des utilisateurs...");
      console.log(`Utilisateur base de données actuel: ${FIXED_USER_ID}`);
      
      // S'assurer que toutes les tables existent pour tous les utilisateurs
      await ensureAllUserTablesExist();
      
      // Effacer le cache pour forcer un rechargement frais
      clearUsersCache();
      
      // Récupérer la liste des utilisateurs
      const users = await getUtilisateurs(true);
      
      console.log("Utilisateurs chargés:", users.length);
      setUtilisateurs(users);
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      
      // Essayons de faire une requête alternative à l'API
      try {
        console.log("Tentative de récupération via l'API alternative check-users.php");
        const API_URL = getApiUrl();
        const altResponse = await fetch(`${API_URL}/check-users.php?_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (altData && altData.records && Array.isArray(altData.records)) {
            console.log("Récupération alternative réussie:", altData.records.length, "utilisateurs");
            setUtilisateurs(altData.records);
            setError(null);
            return;
          }
        }
      } catch (altError) {
        console.error("Échec de la récupération alternative:", altError);
      }
      
      // Si toutes les tentatives échouent, créer un utilisateur par défaut pour l'interface
      const defaultUser: Utilisateur = {
        id: "default_admin",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        status: "active",
        nom: "Admin",
        prenom: "Default",
        identifiant_technique: FIXED_USER_ID
      };
      
      setUtilisateurs([defaultUser]);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs. Un utilisateur par défaut a été créé.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleConnectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions de connexion
    if (!checkPermission(currentUserRole, 'isAdmin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour changer d'utilisateur.",
        variant: "destructive",
      });
      return false;
    }
    
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique} (utilisera toujours ${FIXED_USER_ID})`);

    try {
      // Simulation de connexion - toujours utiliser p71x6d_richard
      console.log(`Connexion réussie (simulée avec ${FIXED_USER_ID})`);
      toast({
        title: "Connexion réussie",
        description: `Connecté en tant que ${FIXED_USER_ID}`,
      });
      
      // S'assurer que les tables existent pour cet utilisateur
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/users.php?action=create_tables_for_user&userId=${encodeURIComponent(identifiantTechnique)}&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Résultat de la création de tables:", result);
      }
      
      // Mettre à jour explicitement localStorage pour la cohérence de l'interface
      localStorage.setItem('currentDatabaseUser', FIXED_USER_ID);
      localStorage.setItem('userPrefix', identifiantTechnique.replace(/[^a-zA-Z0-9]/g, '_'));
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

  const deleteUser = async (userId: string): Promise<boolean> => {
    const currentUserRole = localStorage.getItem('userRole') as UserRole;
    
    // Vérifier les permissions de suppression
    if (!checkPermission(currentUserRole, 'isAdmin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour supprimer un utilisateur.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      console.log(`Tentative de suppression de l'utilisateur avec ID: ${userId}`);
      
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/users.php`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ id: userId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Erreur lors de la suppression:', result);
        throw new Error(result.message || "Erreur lors de la suppression de l'utilisateur");
      }
      
      console.log('Résultat de la suppression:', result);
      
      // Mettre à jour la liste des utilisateurs
      clearUsersCache();
      
      // Filtrer l'utilisateur supprimé de la liste locale
      setUtilisateurs(prev => prev.filter(user => user.id !== userId));
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      throw error;
    }
  };

  return {
    utilisateurs,
    loading,
    error,
    loadUtilisateurs,
    handleConnectAsUser,
    deleteUser,
    retryCount
  };
};
