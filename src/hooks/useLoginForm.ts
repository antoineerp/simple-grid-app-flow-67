
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
  const [error, setError] = useState<string | null>(null);
  
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
    setError(null);
    
    try {
      console.log("Tentative de connexion pour:", data.username);
      const result = await loginUser(data.username, data.password);
      
      if (result.success && result.user) {
        localStorage.setItem('isLoggedIn', 'true');
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${data.username} (${result.user.role || 'utilisateur'})`,
        });
        
        // Redirection vers le pilotage
        navigate("/pilotage", { replace: true });
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      
      // Message d'erreur simple et clair
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Erreur lors de la tentative de connexion";
      
      setError(errorMessage);
      
      toast({
        title: "Échec de la connexion",
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
    onSubmit: form.handleSubmit(onSubmit)
  };
};
