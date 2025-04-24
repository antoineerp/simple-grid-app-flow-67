
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { login } from '@/services';

export const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasDbError, setHasDbError] = useState(false);
  const [hasServerError, setHasServerError] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check if user is already logged in when the component mounts
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn && location.pathname === '/') {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/pilotage', { replace: true });
    }
  }, [navigate, location.pathname]);

  const onSubmit = async (data: LoginFormValues) => {
    if (isLoading) return;
    
    console.log("Traitement de la connexion pour:", data.username);
    setIsLoading(true);
    setHasDbError(false);
    setHasServerError(false);
    setHasAuthError(false);
    
    try {
      console.log("Appel du service login pour:", data.username);
      const result = await login(data.username, data.password);
      console.log("Résultat de connexion:", result);
      
      if (result.success && result.user) {
        // Réinitialiser l'état d'erreur
        setHasDbError(false);
        setHasServerError(false);
        setHasAuthError(false);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${data.username} (${result.user.role || 'utilisateur'})`,
        });
        
        // Forcer la navigation vers le pilotage
        console.log("Redirection vers /pilotage après connexion réussie");
        navigate("/pilotage", { replace: true });
      } else {
        console.error("Échec de connexion:", result.message);
        setHasAuthError(true);
        toast({
          title: "Échec de la connexion",
          description: result.message || "Identifiants invalides",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      
      // Vérifier s'il s'agit d'une erreur de base de données
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes("base de données") || 
            errorMessage.includes("database") ||
            errorMessage.includes("connexion") ||
            errorMessage.includes("sql")) {
          setHasDbError(true);
          toast({
            title: "Erreur de connexion à la base de données",
            description: "Vérifiez la configuration de votre base de données dans le panneau d'administration.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("serveur") || 
                  errorMessage.includes("inaccessible") ||
                  errorMessage.includes("réponse invalide")) {
          setHasServerError(true);
          toast({
            title: "Erreur de connexion au serveur",
            description: "Le serveur d'authentification est temporairement inaccessible.",
            variant: "destructive",
          });
        } else {
          // Erreur générique
          setHasAuthError(true);
          toast({
            title: "Échec de la connexion",
            description: error.message || "Erreur lors de la tentative de connexion",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    hasDbError,
    hasServerError,
    hasAuthError,
    onSubmit: form.handleSubmit(onSubmit)
  };
};
