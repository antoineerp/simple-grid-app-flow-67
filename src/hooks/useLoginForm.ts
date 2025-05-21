
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
    
    console.log('Tentative de connexion pour:', values.username);
    
    try {
      // Traiter le cas spécial pour antcirier@gmail.com
      if (values.username === 'antcirier@gmail.com') {
        console.log("Connexion spéciale pour l'administrateur antcirier@gmail.com");
        // Stocker l'email pour une utilisation future
        localStorage.setItem('userEmail', values.username);
        // Forcer l'utilisation de p71x6d_richard
        localStorage.setItem('userId', 'p71x6d_richard');
        localStorage.setItem('originalUserId', 'p71x6d_richard');
      }
      
      // Utiliser le service de connexion standard
      const result = await login(values.username, values.password);
      
      if (result.success && result.token) {
        console.log("Connexion réussie, token reçu:", result.token.substring(0, 20) + "...");
        console.log("Données utilisateur:", result.user);
        
        // Enregistrer le token avant la navigation
        sessionStorage.setItem('authToken', result.token);
        localStorage.setItem('authToken', result.token);
        
        // Pour l'administrateur, forcer l'utilisation de p71x6d_richard
        if (values.username === 'antcirier@gmail.com') {
          localStorage.setItem('userId', 'p71x6d_richard');
          localStorage.setItem('user_id', 'p71x6d_richard');
          localStorage.setItem('currentDatabaseUser', 'p71x6d_richard');
          console.log("ID utilisateur admin forcé vers:", 'p71x6d_richard');
          
          // Définir un rôle administrateur explicite
          localStorage.setItem('userRole', 'administrateur');
        }
        
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
