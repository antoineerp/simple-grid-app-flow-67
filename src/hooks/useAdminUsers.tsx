
import { useState, useEffect, useCallback } from 'react';
import { connectAsUser, Utilisateur } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { checkPermission, UserRole } from '@/types/roles';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

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
      
      // Utiliser directement l'API des utilisateurs
      const API_URL = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${API_URL}/users.php`);
      
      const response = await fetch(`${API_URL}/users.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (!responseText || !responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      console.log("Réponse texte reçue:", responseText.substring(0, 200));
      
      const data = JSON.parse(responseText);
      console.log("Données utilisateurs brutes:", data);
      
      let users: Utilisateur[] = [];
      
      // Vérification plus flexible des formats de réponse possibles
      if (data && data.records && Array.isArray(data.records)) {
        console.log("Format détecté: data.records");
        users = data.records;
      } else if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
        console.log("Format détecté: data.data.records");
        users = data.data.records;
      } else if (data && Array.isArray(data)) {
        console.log("Format détecté: data[] (tableau direct)");
        users = data;
      } else if (data && data.status === "success" && data.data && Array.isArray(data.data)) {
        console.log("Format détecté: data.data (tableau)");
        users = data.data;
      } else {
        // Solution de secours - tenter de trouver un tableau dans la réponse
        console.log("Recherche de structure utilisateur dans la réponse...");
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].id && data[key][0].email) {
            console.log(`Structure utilisateur trouvée dans data.${key}`);
            users = data[key];
            break;
          }
        }
        
        if (!users.length) {
          console.error("Impossible de trouver une structure utilisateur valide dans:", data);
          throw new Error("Format de données invalide: aucun utilisateur trouvé");
        }
      }
      
      console.log("Utilisateurs traités:", users.length);
      
      setUtilisateurs(users);
      setError(null); // Réinitialiser l'erreur si réussite
      setRetryCount(0); // Réinitialiser le compteur de tentatives
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
      
      // Essayons de faire une requête alternative à l'API
      try {
        console.log("Tentative de récupération via l'API alternative check-users.php");
        const API_URL = getApiUrl();
        const altResponse = await fetch(`${API_URL}/check-users.php`, {
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
      
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
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
      
      // Mettre à jour explicitement localStorage pour la cohérence de l'interface
      localStorage.setItem('currentDatabaseUser', FIXED_USER_ID);
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
    handleConnectAsUser,
    retryCount
  };
};
