
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from '@/services';

// Séparation des schémas et types
const loginSchema = z.object({
  username: z.string().min(3, { message: "Le nom d'utilisateur doit comporter au moins 3 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit comporter au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Extraction de la logique de vérification du logo
const useLogoLoader = () => {
  const [logoSrc, setLogoSrc] = useState("/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png");

  useEffect(() => {
    const img = new Image();
    img.src = "/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png";
    img.onload = () => {
      console.log("Logo FormaCert chargé avec succès");
      setLogoSrc("/lovable-uploads/aba57440-1db2-49ba-8273-c60d6a77b6ee.png");
    };
    img.onerror = () => {
      console.log("Échec du chargement du logo FormaCert, utilisation du logo de secours");
      setLogoSrc("/logo-swiss.svg");
    };
  }, []);

  return logoSrc;
};

// Extraction de la logique de vérification de l'API
const useApiStatusCheck = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/test.php?_=' + new Date().getTime(), {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          setApiStatus('available');
          console.log("API disponible");
        } else {
          setApiStatus('unavailable');
          console.error("API non disponible, code:", response.status);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'API:", error);
        setApiStatus('unavailable');
      }
    };
    
    checkApiStatus();
  }, []);

  return apiStatus;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoSrc = useLogoLoader();
  const apiStatus = useApiStatusCheck();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillTestData = (role: string) => {
    switch(role) {
      case 'admin':
        form.setValue('username', 'p71x6d_system');
        form.setValue('password', 'admin123');
        break;
      case 'manager':
        form.setValue('username', 'p71x6d_dupont');
        form.setValue('password', 'manager456');
        break;
      case 'user':
        form.setValue('username', 'p71x6d_martin');
        form.setValue('password', 'user789');
        break;
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
          
          {apiStatus === 'checking' && (
            <p className="text-sm text-amber-600 mt-2">Vérification de la connexion à l'API...</p>
          )}
          
          {apiStatus === 'unavailable' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mt-2 text-sm">
              ⚠️ L'API n'est pas accessible. La connexion pourrait ne pas fonctionner.
            </div>
          )}
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-app-blue hover:underline">
            Mot de passe oublié?
          </a>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2 text-center">Connexion rapide (mode démo)</p>
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleFillTestData('admin')} className="text-xs">
              Admin
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFillTestData('manager')} className="text-xs">
              Gestionnaire
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFillTestData('user')} className="text-xs">
              Utilisateur
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
