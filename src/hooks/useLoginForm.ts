
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
      // Utilisez un compte de test en mode développement ou test
      const useTestCredentials = 
        process.env.NODE_ENV === 'development' || 
        window.location.hostname === 'localhost' ||
        window.location.hostname.includes('lovableproject.com');
      
      // Si en mode test/dev et pas de mot de passe fourni, utilisez un mot de passe de test
      const username = values.username || 'antcirier@gmail.com';
      const password = values.password || (useTestCredentials ? 'Trottinette43!' : values.password);
      
      // Essayer d'abord auth.php, puis login-alt.php en cas d'échec
      let result;
      try {
        result = await login(username, password);
      } catch (initialError) {
        console.log("Échec avec auth.php, tentative avec login-alt.php");
        
        // Modifier l'URL endpoint dans authService pour utiliser login-alt.php à la place
        const originalUrl = window.location.origin.includes('lovableproject.com') 
          ? 'https://qualiopi.ch/api/login-alt.php' 
          : 'https://qualiopi.ch/api/login-alt.php';
          
        try {
          // Appel direct à login-alt.php
          const response = await fetch(originalUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email: username, password })
          });
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          result = await response.json();
        } catch (fallbackError) {
          // Si les deux méthodes échouent, essayer avec login-test.php comme dernier recours
          console.log("Échec avec login-alt.php, tentative avec login-test.php");
          const testUrl = window.location.origin.includes('lovableproject.com')
            ? 'https://qualiopi.ch/api/login-test.php'
            : 'https://qualiopi.ch/api/login-test.php';
            
          const testResponse = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email: username, password })
          });
          
          if (!testResponse.ok) {
            throw new Error(`Erreur HTTP: ${testResponse.status}`);
          }
          
          result = await testResponse.json();
        }
      }
      
      if (result.success || (result.token && !result.message?.includes('Erreur'))) {
        console.log("Connexion réussie, token reçu:", result.token?.substring(0, 20) + "...");
        console.log("Données utilisateur:", result.user);
        
        // Enregistrer le token avant la navigation
        sessionStorage.setItem('authToken', result.token);
        localStorage.setItem('authToken', result.token);
        
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
