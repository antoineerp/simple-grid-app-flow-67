
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

const DatabaseConfig = () => {
  const { toast } = useToast();
  const [dbConfig, setDbConfig] = useState<DatabaseConfigType>({
    host: "p71x6d.myd.infomaniak.com",
    db_name: FIXED_USER_ID,
    username: FIXED_USER_ID,
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [customDbName, setCustomDbName] = useState(false);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([
    'p71x6d_system',
    'p71x6d_richard',
    'p71x6d_test',
    'p71x6d_dev'
  ]);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: "",
    description: ""
  });

  // Écouter les événements de synchronisation depuis d'autres instances
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('dbTest_timestamp')) {
        console.log("Détection d'un test de connexion réussi depuis un autre appareil");
        loadConfig();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter également l'événement personnalisé
    const handleDatabaseTest = (event: CustomEvent) => {
      console.log("Événement de test de base de données reçu:", event.detail);
      loadConfig();
    };
    
    window.addEventListener('database-test-succeeded' as any, handleDatabaseTest as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('database-test-succeeded' as any, handleDatabaseTest as EventListener);
    };
  }, []);

  // Charger la configuration depuis l'API
  const loadConfig = async () => {
    setLoading(true);
    try {
      const API_URL = getApiUrl();
      console.log("Chargement de la configuration de la base de données depuis:", API_URL);
      
      // Utiliser le endpoint test.php qui fonctionne au lieu de database-config
      const response = await fetch(`${API_URL}/test.php?action=dbconfig`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const responseText = await response.text();
      console.log("Réponse brute reçue:", responseText.substring(0, 200));
      
      if (!responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Configuration reçue:", data);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        throw new Error(`Erreur dans la réponse JSON: ${parseError.message}`);
      }
      
      // Comme nous utilisons un ID fixe, afficher un message explicatif
      toast({
        title: "Configuration chargée",
        description: `L'application utilise toujours la base de données ${FIXED_USER_ID} pour la compatibilité.`,
      });
    } catch (error) {
      console.error("Erreur:", error);
      
      toast({
        title: "Utilisation de la configuration par défaut",
        description: `Les paramètres par défaut avec l'utilisateur ${FIXED_USER_ID} seront utilisés.`,
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
      console.log("Test de la connexion à la base de données");
      
      // Utiliser directement l'endpoint de test qui fonctionne
      const response = await fetch(`${API_URL}/test.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Résultat du test:", data);
      
      if (data.status === 'success') {
        const successResult = {
          success: true,
          message: `Connexion réussie à la base de données ${FIXED_USER_ID}`
        };
        
        setTestResult(successResult);
        
        toast({
          title: "Test réussi",
          description: `La connexion à la base de données ${FIXED_USER_ID} est établie.`,
        });
        
        // Stocker le résultat du test pour les autres appareils
        localStorage.setItem('dbTest_result', JSON.stringify(successResult));
        localStorage.setItem('dbTest_timestamp', new Date().toISOString());
        
        // Déclencher un événement pour informer les autres composants
        window.dispatchEvent(new CustomEvent('database-test-succeeded', { 
          detail: { timestamp: new Date().toISOString() } 
        }));
      } else {
        setTestResult({
          success: false,
          message: data.message || "Échec de la connexion à la base de données"
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
    // Pour cette version simplifiée, nous ne sauvegardons pas réellement la configuration
    // puisque nous utilisons toujours FIXED_USER_ID
    setDialogContent({
      title: "Information",
      description: `L'application utilise toujours la base de données ${FIXED_USER_ID} pour la compatibilité.`
    });
    setShowDialog(true);
    
    // Effectuer un test de connexion pour vérifier que tout fonctionne
    await testConnection();
  };

  // Charger la configuration au chargement du composant
  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration de la base de données</CardTitle>
        <CardDescription>
          Configurez la connexion à votre base de données MySQL Infomaniak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Note importante</h3>
          <p className="text-sm text-yellow-700">
            Pour des raisons de compatibilité, cette application utilise toujours la base de données <strong>{FIXED_USER_ID}</strong>.
            Les paramètres ci-dessous sont affichés à titre informatif.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="host">Hôte</Label>
          <Input 
            id="host" 
            value="p71x6d.myd.infomaniak.com" 
            disabled
            placeholder="p71x6d.myd.infomaniak.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="db_name">Base de données</Label>
          <Input 
            id="db_name" 
            value={FIXED_USER_ID}
            disabled
            placeholder="p71x6d_nom_de_votre_base"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <Input 
            id="username" 
            value={FIXED_USER_ID}
            disabled
            placeholder="p71x6d_utilisateur"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input 
              id="password" 
              type="password"
              value="********"
              disabled
              placeholder="Votre mot de passe"
            />
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
            variant="default" 
            onClick={testConnection} 
            disabled={testingConnection}
            className="flex items-center gap-2"
          >
            {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Tester la connexion
          </Button>
        </div>
      </CardFooter>

      {/* Dialog pour afficher des messages */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DatabaseConfig;
