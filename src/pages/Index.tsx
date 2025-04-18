
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
import { getApiUrl } from '@/config/apiConfig';

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
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'error'>('checking');
  const [apiMessage, setApiMessage] = useState<string>('');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`${getApiUrl()}/test.php?_=${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (response.ok && data && data.status === 200) {
          setApiStatus('available');
          setApiMessage(data.message || 'API disponible');
          console.log("API disponible:", data);
        } else {
          setApiStatus('error');
          setApiMessage(data?.message || `Erreur API: ${response.status}`);
          console.error("API non disponible, code:", response.status, data);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'API:", error);
        setApiStatus('error');
        setApiMessage(error instanceof Error ? error.message : 'Erreur de connexion');
      }
    };
    
    checkApiStatus();
  }, []);

  const retestApi = async () => {
    setApiStatus('checking');
    setApiMessage('Vérification en cours...');
    
    try {
      const cacheBuster = new Date().getTime();
      const response = await fetch(`${getApiUrl()}/test.php?_=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (response.ok && data && data.status === 200) {
        setApiStatus('available');
        setApiMessage(data.message || 'API disponible');
        console.log("API disponible:", data);
      } else {
        setApiStatus('error');
        setApiMessage(data?.message || `Erreur API: ${response.status}`);
        console.error("API non disponible, code:", response.status, data);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'API:", error);
      setApiStatus('error');
      setApiMessage(error instanceof Error ? error.message : 'Erreur de connexion');
    }
  };

  return { apiStatus, apiMessage, retestApi };
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const logoSrc = useLogoLoader();
  const { apiStatus, apiMessage, retestApi } = useApiStatusCheck();
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
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Connexion à votre compte</h1>
          <p className="text-sm text-gray-600 text-center mb-3">Accédez à la plateforme de gestion Qualiflow</p>
          
          {apiStatus === 'checking' && (
            <p className="text-sm text-amber-600 mt-2 mb-2 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Vérification de la connexion à l'API...
            </p>
          )}
          
          {apiStatus === 'available' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mt-2 mb-2 text-sm flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {apiMessage}
            </div>
          )}
          
          {apiStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mt-2 mb-2 text-sm flex flex-col">
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>API joignable mais renvoie une erreur</span>
              </div>
              <p className="text-xs mt-1 pl-6">{apiMessage}</p>
            </div>
          )}
          
          <button 
            onClick={retestApi}
            className="text-xs text-blue-600 hover:text-blue-800 underline mb-4"
          >
            Tester la connexion à l'API
          </button>
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
