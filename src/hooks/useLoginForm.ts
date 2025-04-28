
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { login as loginUser } from '@/services/auth/authService';

export const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const navigate = useNavigate();
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

  const onSubmit = async (data: LoginFormValues) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setHasDbError(false);
    setHasServerError(false);
    setHasAuthError(false);
    
    try {
      console.log("Tentative de connexion pour:", data.username);
      
      // En cas d'erreur fréquente pour antcirier@gmail.com, ajouter un message spécial
      if (data.username === 'antcirier@gmail.com') {
        console.log("Utilisateur spécial détecté: antcirier@gmail.com");
        console.log("Mot de passe attendu: password123 ou Password123!");
        console.log("Mot de passe fourni (longueur): " + data.password.length);
      }
      
      const result = await loginUser(data.username, data.password);
      
      if (result && result.token) {
        // Réinitialiser l'état d'erreur
        setHasDbError(false);
        setHasServerError(false);
        setHasAuthError(false);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${data.username} (${result.user && result.user.role ? result.user.role : 'utilisateur'})`,
        });
        
        // Forcer la navigation vers le pilotage
        console.log("Redirection vers /pilotage après connexion réussie");
        navigate("/pilotage", { replace: true });
      } else {
        setHasAuthError(true);
        toast({
          title: "Échec de la connexion",
          description: "Identifiants invalides ou problème de connexion au serveur",
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
                  errorMessage.includes("réponse invalide") ||
                  errorMessage.includes("404")) {
          setHasServerError(true);
          toast({
            title: "Erreur de connexion au serveur",
            description: "Le serveur d'authentification est temporairement inaccessible.",
            variant: "destructive",
          });
        } else if (errorMessage.includes("mot de passe") ||
                  errorMessage.includes("identifiants") ||
                  errorMessage.includes("invalide")) {
          setHasAuthError(true);
          toast({
            title: "Identifiants incorrects",
            description: "Le nom d'utilisateur ou le mot de passe est incorrect.",
            variant: "destructive",
          });
        } else {
          // Erreur générique
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
