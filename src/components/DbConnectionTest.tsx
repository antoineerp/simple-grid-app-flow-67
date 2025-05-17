
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "@/components/ui/use-toast";

interface DbConfig {
  host: string;
  db_name: string;
  username: string;
  password: string;
}

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
}

const DbConnectionTest: React.FC = () => {
  const [config, setConfig] = useState<DbConfig>({
    host: 'p71x6d.myd.infomaniak.com',
    db_name: 'p71x6d_richard',
    username: 'p71x6d_richard',
    password: ''
  });
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Charger la configuration depuis localStorage s'il existe
    const savedConfig = localStorage.getItem('dbConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (e) {
        console.error("Erreur lors du chargement de la configuration de la base de données:", e);
      }
    }
    
    // Tester la connexion au chargement du composant
    testConnection();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => {
      const newConfig = { ...prev, [name]: value };
      // Sauvegarder dans localStorage
      localStorage.setItem('dbConfig', JSON.stringify(newConfig));
      return newConfig;
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    setResults([
      { name: 'Vérification de la connexion', status: 'pending', message: 'Test en cours...' }
    ]);

    try {
      // Test de connexion à la base de données
      const response = await fetch('/api/db-connection-test.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults([
          { name: 'Connexion à la base de données', status: 'success', message: data.message || 'Connexion réussie' }
        ]);
        
        // Tester maintenant la structure des tables
        await testTables();
      } else {
        setResults([
          { name: 'Connexion à la base de données', status: 'error', message: data.message || 'Erreur de connexion' }
        ]);
      }
    } catch (error) {
      setResults([
        { name: 'Connexion à la base de données', status: 'error', message: `Erreur: ${error instanceof Error ? error.message : String(error)}` }
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  const testTables = async () => {
    try {
      const response = await fetch('/api/check-tables.php');
      const data = await response.json();
      
      if (data.success) {
        setResults(prev => [...prev, 
          { name: 'Structure des tables', status: 'success', message: `${data.tables_count} tables trouvées` }
        ]);
      } else {
        setResults(prev => [...prev, 
          { name: 'Structure des tables', status: 'warning', message: data.message || 'Problème avec les tables' }
        ]);
      }
    } catch (error) {
      setResults(prev => [...prev, 
        { name: 'Structure des tables', status: 'error', message: `Erreur lors de la vérification des tables: ${error instanceof Error ? error.message : String(error)}` }
      ]);
    }
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/update-db-credentials.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Configuration sauvegardée",
          description: "La configuration de la base de données a été mise à jour",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible de sauvegarder la configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test de Connexion à la Base de Données</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? "Masquer la configuration" : "Afficher la configuration"}
          </Button>
          <Button 
            onClick={testConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours
              </>
            ) : 'Tester la connexion'}
          </Button>
        </div>
      </div>

      {showConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Configuration de la Base de Données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">Hôte</Label>
                <Input
                  id="host"
                  name="host"
                  value={config.host}
                  onChange={handleChange}
                  placeholder="Nom d'hôte MySQL"
                />
              </div>
              <div>
                <Label htmlFor="db_name">Nom de la base de données</Label>
                <Input
                  id="db_name"
                  name="db_name"
                  value={config.db_name}
                  onChange={handleChange}
                  placeholder="Nom de la base de données"
                />
              </div>
              <div>
                <Label htmlFor="username">Utilisateur</Label>
                <Input
                  id="username"
                  name="username"
                  value={config.username}
                  onChange={handleChange}
                  placeholder="Nom d'utilisateur"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={config.password}
                  onChange={handleChange}
                  placeholder="Mot de passe"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={saveConfig}>
                Sauvegarder la configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {results.map((result, index) => (
        <Card key={index} className={`${
          result.status === 'success' ? 'border-green-200 bg-green-50' : 
          result.status === 'error' ? 'border-red-200 bg-red-50' : 
          result.status === 'warning' ? 'border-amber-200 bg-amber-50' : 
          'border-blue-200 bg-blue-50'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              {getStatusIcon(result.status)}
              <span className="ml-2">{result.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{result.message}</p>
          </CardContent>
        </Card>
      ))}

      {results.some(r => r.status === 'error') && (
        <Alert variant="destructive">
          <AlertTitle>Problèmes de connexion détectés</AlertTitle>
          <AlertDescription>
            Vérifiez les paramètres de connexion à votre base de données et assurez-vous que votre serveur MySQL est en cours d'exécution.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DbConnectionTest;
