
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
    
    // Special test for antcirier@gmail.com
    if (values.username === 'antcirier@gmail.com') {
      console.log('Utilisateur spécial détecté:', values.username);
      console.log('Mot de passe attendu: password123 ou Password123!');
      console.log('Mot de passe fourni (longueur):', values.password.length);
    }
    
    try {
      const result = await login(values.username, values.password);
      
      if (result.success && result.token) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté",
        });
        
        // Rediriger vers le tableau de bord
        navigate('/pilotage');
      } else {
        setError(result.message || 'Échec de la connexion');
        
        // Déterminer le type d'erreur
        if (result.message?.includes('base de données')) {
          setHasDbError(true);
        } else if (result.message?.includes('serveur')) {
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
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la connexion";
      setError(errorMessage);
      
      // Déterminer le type d'erreur
      if (errorMessage.includes('base de données')) {
        setHasDbError(true);
      } else if (errorMessage.includes('serveur')) {
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
