
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
        localStorage.setItem('authToken', result.token);
        
        // Stocker les données utilisateur pour éviter d'avoir à redécoder le token
        if (result.user) {
          localStorage.setItem('currentUser', JSON.stringify(result.user));
        }
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${result.user?.prenom || ''} ${result.user?.nom || ''}`,
        });
        
        console.log("Connexion réussie, préparation de la redirection vers /pilotage");
        
        // Attendre un court moment pour s'assurer que le token est bien enregistré
        setTimeout(() => {
          try {
            // Utiliser navigate avec replace pour éviter les problèmes de retour en arrière
            navigate('/pilotage', { replace: true });
            
            // N'utiliser le fallback que si nécessaire après un délai plus long
            const fallbackTimeout = setTimeout(() => {
              // Vérifier si nous sommes toujours sur la page d'accueil
              if (window.location.pathname === '/') {
                console.log("Fallback: redirection vers /pilotage via window.location");
                window.location.href = '/pilotage';
              }
            }, 1500);
            
            // Nettoyer le timeout si le composant est démonté
            return () => clearTimeout(fallbackTimeout);
          } catch (navError) {
            console.error("Erreur lors de la navigation:", navError);
            // Fallback immédiat en cas d'échec de React Router
            window.location.href = '/pilotage';
          }
        }, 200);
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
