
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { login } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

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
      const result = await login(values.username, values.password);
      
      if (result.success && result.token) {
        console.log("Connexion réussie, token reçu:", result.token.substring(0, 20) + "...");
        console.log("Données utilisateur:", result.user);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${result.user?.prenom || ''} ${result.user?.nom || ''}`,
        });
        
        console.log("Connexion réussie, redirection vers /dashboard");
        
        try {
          // Navigation vers le tableau de bord
          navigate('/dashboard', { replace: true });
          
          // Fallback si la navigation ne fonctionne pas
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              console.log("Fallback: redirection par window.location");
              window.location.href = '/dashboard';
            }
          }, 500);
        } catch (navError) {
          console.error("Erreur lors de la navigation:", navError);
          window.location.href = '/dashboard';
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
