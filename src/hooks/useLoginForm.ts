
import { useState } from 'react';
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
  
  const onSubmit = async (values: LoginFormValues) => {
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
        
        // S'assurer que le token est bien enregistré avant la navigation
        sessionStorage.setItem('authToken', result.token);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${result.user?.prenom || ''} ${result.user?.nom || ''}`,
        });
        
        console.log("Connexion réussie, préparation de la redirection vers /pilotage");
        
        // Utiliser setTimeout avec un délai plus long pour s'assurer que le token est bien enregistré
        setTimeout(() => {
          console.log("Redirection vers /pilotage via navigate()");
          
          // Notification avant la navigation
          toast({
            title: "Redirection",
            description: "Navigation vers le tableau de bord en cours...",
          });
          
          // Navigation via react-router
          navigate('/pilotage', { replace: true });
          
          // Log supplémentaire après la demande de navigation
          console.log("Navigation demandée vers /pilotage, vérification de l'URL actuelle:", window.location.href);
        }, 500);
      } else {
        console.error("Échec de connexion:", result.message);
        setError(result.message || 'Échec de la connexion');
        
        // Déterminer le type d'erreur
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
      
      // Déterminer le type d'erreur
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
  };
  
  return {
    form,
    isLoading,
    error,
    hasDbError,
    hasServerError,
    hasAuthError,
    onSubmit: form.handleSubmit(onSubmit)
  };
};
