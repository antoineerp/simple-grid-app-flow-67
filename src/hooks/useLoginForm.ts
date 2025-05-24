
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { login } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { LoginResponse } from '@/types/auth';
import { getApiUrl } from '@/config/apiConfig';

export interface LoginFormValues {
  username: string;
  password: string;
}

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDbError, setHasDbError] = useState(false);
  const [hasServerError, setHasServerError] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  
  const form = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  // Fonction pour tester si le serveur PHP fonctionne
  const testPhpServer = async (): Promise<{success: boolean; message: string}> => {
    try {
      const API_URL = getApiUrl();
      console.log("Test du serveur PHP:", `${API_URL}/login-test.php?test=1`);
      
      const response = await fetch(`${API_URL}/login-test.php?test=1&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      const responseText = await response.text();
      
      // Vérifier si la réponse contient du PHP non exécuté
      if (responseText.includes('<?php')) {
        console.error("Le serveur ne traite pas les fichiers PHP:", responseText.substring(0, 100));
        return {
          success: false,
          message: "Le serveur ne traite pas les fichiers PHP. Vérifiez la configuration du serveur."
        };
      }
      
      return {
        success: true,
        message: "Le serveur PHP fonctionne correctement"
      };
    } catch (error) {
      console.error("Erreur lors du test du serveur PHP:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  };
  
  const handleSubmit = useCallback(async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setHasDbError(false);
    setHasServerError(false);
    setHasAuthError(false);
    
    console.log('Tentative de connexion pour:', values.username);
    
    // Tester d'abord si le serveur PHP fonctionne
    const phpServerTest = await testPhpServer();
    if (!phpServerTest.success) {
      setHasServerError(true);
      setError(phpServerTest.message);
      setIsLoading(false);
      
      toast({
        title: "Erreur serveur",
        description: phpServerTest.message,
        variant: "destructive",
      });
      
      return;
    }
    
    try {
      // Stocker l'email pour une utilisation future
      localStorage.setItem('userEmail', values.username);
      
      // Utiliser le service de connexion standard
      const result = await login(values.username, values.password);
      
      if (result.success && result.token) {
        console.log("Connexion réussie, token reçu:", result.token.substring(0, 20) + "...");
        console.log("Données utilisateur:", result.user);
        
        // Enregistrer le token avant la navigation
        sessionStorage.setItem('authToken', result.token);
        localStorage.setItem('authToken', result.token);
        
        // Stocker l'identifiant utilisateur (email)
        if (result.user?.identifiant_technique) {
          localStorage.setItem('userId', result.user.identifiant_technique);
          localStorage.setItem('user_id', result.user.identifiant_technique);
          localStorage.setItem('currentDatabaseUser', result.user.identifiant_technique);
        } else {
          localStorage.setItem('userId', values.username);
          localStorage.setItem('user_id', values.username);
          localStorage.setItem('currentDatabaseUser', values.username);
        }
        
        console.log("ID utilisateur défini:", localStorage.getItem('userId'));
        
        // Stocker les données utilisateur et le rôle explicitement
        if (result.user) {
          localStorage.setItem('currentUser', JSON.stringify(result.user));
          // S'assurer que le rôle est correctement enregistré pour les vérifications de permissions
          if (result.user.role) {
            localStorage.setItem('userRole', result.user.role);
          }
        }
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${result.user?.prenom || ''} ${result.user?.nom || ''}`,
        });
        
        console.log("Connexion réussie, redirection vers /pilotage");
        
        try {
          // Navigation simplifiée, plus robuste
          navigate('/pilotage', { replace: true });
          
          // Fallback si la navigation ne fonctionne pas
          setTimeout(() => {
            if (window.location.pathname === '/') {
              console.log("Fallback: redirection par window.location");
              window.location.href = '/pilotage';
            }
          }, 500);
        } catch (navError) {
          console.error("Erreur lors de la navigation:", navError);
          window.location.href = '/pilotage';
        }
      } else {
        console.error("Échec de connexion:", result.message);
        setError(result.message || 'Échec de la connexion');
        
        if (result.message?.includes('base de données') || result.message?.includes('database')) {
          setHasDbError(true);
        } else if (result.message?.includes('serveur') || result.message?.includes('server') || result.message?.includes('env.php')) {
          setHasServerError(true);
        } else {
          setHasAuthError(true);
        }
        
        toast({
          title: "Erreur de connexion",
          description: result.message || "Identifiants invalides",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Exception lors de la connexion:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la connexion";
      setError(errorMessage);
      
      if (errorMessage.includes('base de données') || errorMessage.includes('database')) {
        setHasDbError(true);
      } else if (errorMessage.includes('serveur') || errorMessage.includes('server') || errorMessage.includes('env.php')) {
        setHasServerError(true);
      } else {
        setHasAuthError(true);
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);
  
  const onSubmit = form.handleSubmit(handleSubmit);
  
  return {
    form,
    isLoading,
    error,
    hasDbError,
    hasServerError,
    hasAuthError,
    onSubmit
  };
};
