
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from '@/services';
import { getApiUrl } from '@/config/apiConfig';

const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logoSrc, setLogoSrc] = useState("/logo-swiss.svg");
  const [apiStatus, setApiStatus] = useState<string>('En attente');
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Try to load FormaCert logo, with fallback to Swiss logo
  useEffect(() => {
    const img = new Image();
    img.src = "/lovable-uploads/formacert-logo.png";
    img.onload = () => setLogoSrc("/lovable-uploads/formacert-logo.png");
    img.onerror = () => {
      console.log("Using fallback logo");
      setLogoSrc("/logo-swiss.svg");
    };
    
    // Vérifier si l'API est accessible
    const checkApiStatus = async () => {
      try {
        setApiStatus('Vérification...');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/info.php`, { method: 'HEAD' });
        if (response.ok) {
          setApiStatus('API accessible');
        } else {
          setApiStatus(`API inaccessible (${response.status})`);
        }
      } catch (error) {
        setApiStatus('API inaccessible (erreur de connexion)');
        console.error('Erreur lors de la vérification de l\'API:', error);
      }
    };
    
    checkApiStatus();
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Connexion en cours",
        description: "Veuillez patienter...",
      });
      
      console.log("Tentative de connexion avec:", data.username);
      const result = await loginUser(data.username, data.password);
      
      if (result.success) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", result.user.identifiant_technique || data.username);
        
        toast({
          title: `Connexion réussie`,
          description: `Bienvenue, ${result.user.role}`,
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
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:mr-8">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logoSrc} 
            alt="FormaCert Logo" 
            className="w-48 mb-4"
            onError={(e) => {
              console.error("Logo failed to load:", (e.target as HTMLImageElement).src);
              (e.target as HTMLImageElement).src = "/logo-swiss.svg";
            }}
          />
          <h1 className="text-2xl font-bold text-gray-800">Bienvenue sur FormaCert</h1>
          <p className="text-sm text-gray-500 mt-1">Statut API: {apiStatus}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="Entrez votre nom d'utilisateur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Entrez votre mot de passe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
            
            {/* Options de compte de démonstration pour le développement */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" 
                onClick={() => {
                  form.setValue("username", "admin");
                  form.setValue("password", "admin123");
                }}
              >
                Compte Admin
              </Button>
              <Button type="button" variant="outline" size="sm"
                onClick={() => {
                  form.setValue("username", "user");
                  form.setValue("password", "user789");
                }}
              >
                Compte Utilisateur
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-app-blue hover:underline">
            Mot de passe oublié?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
