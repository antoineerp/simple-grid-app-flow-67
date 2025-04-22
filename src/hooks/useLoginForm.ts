
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from '@/services';

// Define the form schema
export const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      console.log("Tentative de connexion avec:", data.username);
      const result = await loginUser(data.username, data.password);
      
      if (result.success) {
        // Stocker explicitement le nom d'utilisateur saisi
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", data.username);
        
        // Si l'API renvoie un identifiant technique différent, le stocker également
        if (result.user && result.user.identifiant_technique) {
          localStorage.setItem("userTechnicalId", result.user.identifiant_technique);
        }
        
        toast({
          title: `Connexion réussie`,
          description: `Bienvenue, ${data.username} (${result.user?.role || 'utilisateur'})`,
        });
        
        navigate("/pilotage");
      } else {
        toast({
          title: "Échec de la connexion",
          description: result.error || "Identifiants incorrects",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de la connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    onSubmit: form.handleSubmit(onSubmit)
  };
};
