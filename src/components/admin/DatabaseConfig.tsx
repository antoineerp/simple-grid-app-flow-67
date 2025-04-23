
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon, RefreshCw, Database, Save, Loader2, AlertTriangle } from 'lucide-react';

interface DatabaseConfigType {
  host: string;
  db_name: string;
  username: string;
  password: string;
  available_databases?: string[];
}

const DatabaseConfig = () => {
  const { toast } = useToast();
  const [dbConfig, setDbConfig] = useState<DatabaseConfigType>({
    host: "p71x6d.myd.infomaniak.com",
    db_name: "p71x6d_system",
    username: "p71x6d_system",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [customDbName, setCustomDbName] = useState(false);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([
    'p71x6d_system',
    'p71x6d_test',
    'p71x6d_prod',
    'p71x6d_dev'
  ]);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      console.log("Chargement de la configuration de la base de données depuis:", API_URL);
      
      const response = await fetch(`${API_URL}/database-config`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log("Réponse brute reçue:", responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Configuration reçue:", data);
        } catch (parseError) {
          console.error("Erreur de parsing JSON:", parseError);
          throw new Error(`Erreur dans la réponse JSON: ${parseError.message}. Réponse reçue: ${responseText.substring(0, 100)}...`);
        }
        
        // Mettre à jour les bases de données disponibles
        if (data.available_databases && data.available_databases.length > 0) {
          setAvailableDatabases(data.available_databases);
        }
        
        // Mettre à jour la configuration
        setDbConfig(prev => ({
          ...prev,
          host: data.host || prev.host,
          db_name: data.db_name || prev.db_name,
          username: data.username || prev.username,
          // Ne pas mettre à jour le mot de passe
        }));
        
        // Vérifier si la base de données actuelle est dans la liste des bases disponibles
        const isCustom = !availableDatabases.includes(data.db_name);
        setCustomDbName(isCustom);
        
        toast({
          title: "Configuration chargée",
          description: "La configuration de la base de données a été chargée avec succès.",
        });
      } else {
        console.error("Erreur lors du chargement de la configuration:", response.status, response.statusText);
        
        const errorText = await response.text();
        console.error("Contenu de l'erreur:", errorText.substring(0, 200));
        
        toast({
          title: "Erreur",
          description: `Impossible de charger la configuration de la base de données. (${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du chargement de la configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Tester la connexion à la base de données
  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const API_URL = getApiUrl();
      console.log("Test de la connexion à la base de données avec:", dbConfig);
      
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
      
      const responseText = await response.text();
      console.log("Réponse brute du test:", responseText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erreur de parsing JSON dans la réponse du test:", parseError);
        throw new Error(`Erreur dans la réponse JSON du test: ${parseError.message}`);
      }
      
      console.log("Résultat du test:", data);
      
      if (data.status === 'success') {
        setTestResult({
          success: true,
          message: "Connexion réussie à la base de données " + dbConfig.db_name
        });
        
        toast({
          title: "Test réussi",
          description: "La connexion à la base de données est établie.",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Échec de la connexion à la base de données"
        });
        
        toast({
          title: "Test échoué",
          description: "Impossible de se connecter à la base de données.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du test:", error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Une erreur s'est produite lors du test de connexion"
      });
      
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du test de connexion.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Sauvegarder la configuration
  const saveConfig = async () => {
    setSaving(true);
    try {
      const API_URL = getApiUrl();
      console.log("Sauvegarde de la configuration de la base de données:", dbConfig);
      
      const response = await fetch(`${API_URL}/database-config`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
      
      const responseText = await response.text();
      console.log("Réponse brute de la sauvegarde:", responseText.substring(0, 200));
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erreur de parsing JSON dans la réponse de sauvegarde:", parseError);
        throw new Error(`Erreur dans la réponse JSON de sauvegarde: ${parseError.message}`);
      }
      
      if (response.ok) {
        console.log("Résultat de la sauvegarde:", result);
        
        if (result.status === 'success') {
          toast({
            title: "Configuration sauvegardée",
            description: "La configuration de la base de données a été sauvegardée avec succès.",
          });
          
          // Tester la connexion après la sauvegarde
          await testConnection();
        } else {
          toast({
            title: "Avertissement",
            description: result.message || "La configuration a été sauvegardée mais il y a un problème.",
            variant: "destructive",
          });
        }
      } else {
        console.error("Erreur lors de la sauvegarde:", response.status, response.statusText);
        toast({
          title: "Erreur",
          description: result?.message || `Impossible de sauvegarder la configuration de la base de données. (${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la sauvegarde de la configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);

  // Gestionnaire de changement pour les champs de formulaire
  const handleChange = (field: keyof DatabaseConfigType, value: string) => {
    setDbConfig(prev => ({ ...prev, [field]: value }));
    
    // Si le champ est db_name, mettre à jour l'username si ce n'est pas personnalisé
    if (field === 'db_name' && !customDbName) {
      setDbConfig(prev => ({ ...prev, username: value }));
    }
  };

  // Gestionnaire pour le select de la base de données
  const handleDatabaseSelect = (value: string) => {
    if (value === 'custom') {
      setCustomDbName(true);
    } else {
      setCustomDbName(false);
      handleChange('db_name', value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la base de données</CardTitle>
        <CardDescription>
          Configurez la connexion à votre base de données MySQL Infomaniak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="host">Hôte</Label>
          <Input 
            id="host" 
            value={dbConfig.host} 
            onChange={(e) => handleChange('host', e.target.value)}
            placeholder="p71x6d.myd.infomaniak.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="db_name">Base de données</Label>
          {customDbName ? (
            <Input 
              id="db_name" 
              value={dbConfig.db_name} 
              onChange={(e) => handleChange('db_name', e.target.value)} 
              placeholder="p71x6d_nom_de_votre_base"
            />
          ) : (
            <Select value={dbConfig.db_name} onValueChange={handleDatabaseSelect}>
              <SelectTrigger id="db_name">
                <SelectValue placeholder="Sélectionnez une base de données" />
              </SelectTrigger>
              <SelectContent>
                {availableDatabases.map(db => (
                  <SelectItem key={db} value={db}>{db}</SelectItem>
                ))}
                <SelectItem value="custom">Autre (saisie personnalisée)</SelectItem>
              </SelectContent>
            </Select>
          )}
          {customDbName && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => setCustomDbName(false)}
            >
              Revenir aux bases prédéfinies
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input 
            id="username" 
            value={dbConfig.username} 
            onChange={(e) => handleChange('username', e.target.value)} 
            placeholder="p71x6d_utilisateur"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              value={dbConfig.password} 
              onChange={(e) => handleChange('password', e.target.value)} 
              placeholder="Votre mot de passe"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={loadConfig} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Recharger
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testConnection} 
            disabled={testingConnection}
            className="flex items-center gap-2"
          >
            {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Tester
          </Button>
          
          <Button 
            variant="default" 
            onClick={saveConfig} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DatabaseConfig;
