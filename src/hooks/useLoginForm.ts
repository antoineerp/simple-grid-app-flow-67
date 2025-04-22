
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from '@/services';

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
    
    try {
      console.log("Tentative de connexion pour:", data.username);
      console.log("Nom d'utilisateur saisi:", data.username);
      const result = await loginUser(data.username, data.password);
      
      if (result.success && result.user) {
        // Réinitialiser l'état d'erreur
        setHasDbError(false);
        setHasServerError(false);
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${data.username} (${result.user.role || 'utilisateur'})`,
        });
        
        navigate("/pilotage");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      
      // Vérifier s'il s'agit d'une erreur de base de données
      if (error instanceof Error) {
        if (error.message.includes("base de données") || 
            error.message.includes("database")) {
          setHasDbError(true);
          
          // Essayer de se connecter avec les identifiants de secours
          if (data.username === 'admin' && data.password === 'admin123' || 
              data.username === 'antcirier@gmail.com' && data.password === 'password123') {
            // Rediriger vers le tableau de bord
            toast({
              title: "Mode de secours activé",
              description: "Connexion en mode de secours réussie. Certaines fonctionnalités peuvent être limitées.",
            });
            navigate("/pilotage");
            return;
          }
        } else if (error.message.includes("serveur") || 
                  error.message.includes("inaccessible") ||
                  error.message.includes("Réponse invalide")) {
          setHasServerError(true);
          
          // Essayer de se connecter avec les identifiants de secours
          if (data.username === 'admin' && data.password === 'admin123' || 
              data.username === 'antcirier@gmail.com' && data.password === 'password123') {
            // Rediriger vers le tableau de bord
            toast({
              title: "Mode de secours activé",
              description: "Connexion en mode de secours réussie. Certaines fonctionnalités peuvent être limitées.",
            });
            navigate("/pilotage");
            return;
          }
        }
      }
      
      // Le toast d'erreur est déjà géré dans loginUser
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    hasDbError,
    hasServerError,
    onSubmit: form.handleSubmit(onSubmit)
  };
};
