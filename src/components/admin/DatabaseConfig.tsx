
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";
import DatabaseConfigForm from './database-config/DatabaseConfigForm';
import DatabaseActions from './database-config/DatabaseActions';
import DatabaseTestAlert from './database-config/DatabaseTestAlert';
import { DatabaseConfigType, TestResult } from './database-config/types';

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
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load config function
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
        setDbConfig(prev => ({
          ...prev,
          host: data.host || prev.host,
          db_name: data.db_name || prev.db_name,
          username: data.username || prev.username,
        }));
        
        if (data.available_databases?.length > 0) {
          setAvailableDatabases(data.available_databases);
        }
        
        setCustomDbName(!data.available_databases?.includes(data.db_name));
        
        toast({
          title: "Configuration chargée",
          description: "La configuration de la base de données a été chargée avec succès.",
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

  // Test connection function
  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/database-test`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dbConfig)
      });
      
      const data = await response.json();
      
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
    } finally {
      setTestingConnection(false);
    }
  };

  // Save config function
  const saveConfig = async () => {
    setSaving(true);
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
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Configuration sauvegardée",
          description: "La configuration de la base de données a été sauvegardée avec succès.",
        });
        
        await testConnection();
      } else {
        toast({
          title: "Erreur",
          description: result?.message || `Impossible de sauvegarder la configuration de la base de données.`,
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

  const handleChange = (field: keyof DatabaseConfigType, value: string) => {
    setDbConfig(prev => ({ ...prev, [field]: value }));
    
    if (field === 'db_name' && !customDbName) {
      setDbConfig(prev => ({ ...prev, username: value }));
    }
  };

  const handleDatabaseSelect = (value: string) => {
    if (value === 'custom') {
      setCustomDbName(true);
    } else {
      setCustomDbName(false);
      handleChange('db_name', value);
    }
  };

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
      <CardContent>
        <DatabaseConfigForm
          dbConfig={dbConfig}
          customDbName={customDbName}
          setCustomDbName={setCustomDbName}
          availableDatabases={availableDatabases}
          handleChange={handleChange}
          handleDatabaseSelect={handleDatabaseSelect}
        />
        <DatabaseTestAlert testResult={testResult} />
      </CardContent>
      <CardFooter>
        <DatabaseActions
          loading={loading}
          saving={saving}
          testingConnection={testingConnection}
          onRefresh={loadConfig}
          onTest={testConnection}
          onSave={saveConfig}
        />
      </CardFooter>
    </Card>
  );
};

export default DatabaseConfig;
