
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { login } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { LoginResponse } from '@/types/auth';

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
  
  const handleSubmit = useCallback(async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setHasDbError(false);
    setHasServerError(false);
    setHasAuthError(false);
    
    console.log('Connexion UNIQUEMENT via la base de données Infomaniak pour:', values.username);
    
    try {
      // Stocker l'email pour une utilisation future
      localStorage.setItem('userEmail', values.username);
      
      // Utiliser UNIQUEMENT le service de connexion à la base de données Infomaniak
      const result = await login(values.username, values.password);
      
      if (result.success && result.token) {
        console.log("Connexion réussie via la base de données Infomaniak, token reçu:", result.token.substring(0, 20) + "...");
        console.log("Données utilisateur depuis la base de données:", result.user);
        
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
        
        console.log("ID utilisateur défini depuis la base de données:", localStorage.getItem('userId'));
        
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
          description: `Bienvenue ${result.user?.prenom || ''} ${result.user?.nom || ''} - Connecté via la base de données Infomaniak`,
        });
        
        console.log("Connexion réussie via la base de données, redirection vers /pilotage");
        
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
        console.error("ERREUR: Échec de connexion à la base de données Infomaniak:", result.message);
        setError(`ERREUR DE BASE DE DONNÉES: ${result.message || 'Connexion à la base de données Infomaniak impossible'}`);
        
        // Marquer explicitement comme erreur de base de données
        setHasDbError(true);
        
        toast({
          title: "Erreur de connexion à la base de données",
          description: `Impossible de se connecter à la base de données Infomaniak: ${result.message || "Erreur inconnue"}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("EXCEPTION: Erreur critique lors de la connexion à la base de données Infomaniak:", err);
      const errorMessage = `ERREUR DE CONNEXION BASE DE DONNÉES: ${err instanceof Error ? err.message : "Erreur lors de la connexion à la base de données Infomaniak"}`;
      setError(errorMessage);
      
      // Marquer comme erreur de base de données
      setHasDbError(true);
      
      toast({
        title: "Erreur critique",
        description: "Impossible de se connecter à la base de données Infomaniak. Vérifiez votre connexion.",
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
