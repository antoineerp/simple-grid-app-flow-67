
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon, RefreshCw } from 'lucide-react';

interface DatabaseConfigType {
  host: string;
  db_name: string;
  username: string;
  password: string;
}

const DatabaseConfig = () => {
  const { toast } = useToast();
  const [dbConfig, setDbConfig] = useState<DatabaseConfigType>({
    host: "",
    db_name: "",
    username: "",
    password: "********"
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/database-config`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDbConfig(data);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors du chargement de la configuration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration de la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder la configuration
  const saveConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/database-config`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Configuration de la base de données mise à jour avec succès",
        });
        loadConfig(); // Recharger pour s'assurer que tout est à jour
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la sauvegarde de la configuration");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration de la base de données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Tester la connexion à la base de données
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        toast({
          title: "Connexion réussie",
          description: "La connexion à la base de données a été établie avec succès",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Échec de la connexion à la base de données");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "La connexion à la base de données a échoué",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Mettre à jour les inputs lorsque la configuration change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof DatabaseConfigType) => {
    setDbConfig(prevConfig => ({
      ...prevConfig,
      [field]: e.target.value
    }));
  };

  // Basculer l'affichage du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la base de données</CardTitle>
        <CardDescription>Gérez les paramètres de connexion à la base de données</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="db-host">Hôte</Label>
              <Input 
                id="db-host"
                value={dbConfig.host}
                onChange={(e) => handleInputChange(e, 'host')}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="db-name">Nom de la base de données</Label>
              <Input 
                id="db-name"
                value={dbConfig.db_name}
                onChange={(e) => handleInputChange(e, 'db_name')}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="db-username">Nom d'utilisateur</Label>
              <Input 
                id="db-username"
                value={dbConfig.username}
                onChange={(e) => handleInputChange(e, 'username')}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="db-password">Mot de passe</Label>
              <div className="flex">
                <Input 
                  id="db-password"
                  type={showPassword ? "text" : "password"}
                  value={dbConfig.password}
                  onChange={(e) => handleInputChange(e, 'password')}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="ml-2"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertDescription>
              Attention : La modification de ces paramètres peut entraîner une perte de connexion à la base de données si les informations sont incorrectes. Assurez-vous de connaître les informations correctes avant de sauvegarder.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testingConnection || loading}>
            {testingConnection ? "Test en cours..." : "Tester la connexion"}
          </Button>
        </div>
        <Button onClick={saveConfig} disabled={loading}>
          Enregistrer la configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseConfig;
