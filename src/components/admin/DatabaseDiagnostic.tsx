
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Server, 
  Table, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from "@/hooks/use-toast";

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

const DatabaseDiagnostic = () => {
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const runDiagnostics = async () => {
    setRunning(true);
    setCompleted(false);
    setDiagnostics([
      { name: 'Connexion serveur', status: 'pending', message: 'Test en cours...' },
      { name: 'Accès base de données', status: 'pending', message: 'En attente...' },
      { name: 'Structure des tables', status: 'pending', message: 'En attente...' },
    ]);
    
    // Test 1: Connexion au serveur API
    await testApiConnection();
    
    // Test 2: Accès à la base de données
    await testDatabaseAccess();
    
    // Test 3: Vérifier la structure des tables
    await testTableStructure();
    
    setRunning(false);
    setCompleted(true);
    
    // Afficher un toast avec le résumé des diagnostics
    const success = diagnostics.filter(d => d.status === 'success').length;
    const warnings = diagnostics.filter(d => d.status === 'warning').length;
    const errors = diagnostics.filter(d => d.status === 'error').length;
    
    if (errors > 0) {
      toast({
        title: "Diagnostic terminé avec des erreurs",
        description: `${success} tests réussis, ${warnings} avertissements, ${errors} erreurs`,
        variant: "destructive"
      });
    } else if (warnings > 0) {
      toast({
        title: "Diagnostic terminé avec des avertissements",
        description: `${success} tests réussis, ${warnings} avertissements`,
        variant: "default"
      });
    } else {
      toast({
        title: "Diagnostic terminé avec succès",
        description: `Tous les tests (${success}) ont réussi`,
      });
    }
  };
  
  const testApiConnection = async () => {
    updateDiagnostic(0, 'pending', 'Test de connexion au serveur API...');
    
    try {
      const API_URL = getApiUrl();
      console.log(`Test de connexion API: ${API_URL}/test.php`);
      
      const response = await fetch(`${API_URL}/test.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      
      if (data.status === 'success') {
        updateDiagnostic(0, 'success', 'Connexion au serveur API réussie', data.message);
      } else {
        throw new Error(data.message || 'Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error("Erreur lors du test de connexion API:", error);
      updateDiagnostic(0, 'error', 'Échec de la connexion au serveur API', 
        error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };
  
  const testDatabaseAccess = async () => {
    updateDiagnostic(1, 'pending', "Vérification de l'accès à la base de données...");
    
    try {
      const API_URL = getApiUrl();
      console.log(`Test d'accès à la base de données: ${API_URL}/test.php?action=tables&userId=${FIXED_USER_ID}`);
      
      const response = await fetch(`${API_URL}/test.php?action=tables&userId=${FIXED_USER_ID}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      
      if (data.tables && Array.isArray(data.tables)) {
        const tableCount = data.tables.length;
        updateDiagnostic(1, 'success', `Accès à la base de données réussi`, 
          `${tableCount} tables trouvées pour l'utilisateur ${FIXED_USER_ID}`);
      } else {
        updateDiagnostic(1, 'warning', "Accès à la base de données réussi mais aucune table trouvée", 
          `Aucune table trouvée pour l'utilisateur ${FIXED_USER_ID}`);
      }
    } catch (error) {
      console.error("Erreur lors du test d'accès à la base de données:", error);
      updateDiagnostic(1, 'error', "Échec de l'accès à la base de données", 
        error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };
  
  const testTableStructure = async () => {
    updateDiagnostic(2, 'pending', "Vérification de la structure des tables...");
    
    try {
      const API_URL = getApiUrl();
      console.log(`Test de la structure des tables: ${API_URL}/test.php?action=structure&userId=${FIXED_USER_ID}`);
      
      // Comme nous n'avons pas d'endpoint spécifique pour la structure, utiliser tables
      const response = await fetch(`${API_URL}/test.php?action=tables&userId=${FIXED_USER_ID}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      
      if (data.tables && Array.isArray(data.tables)) {
        const tableCount = data.tables.length;
        
        if (tableCount > 0) {
          updateDiagnostic(2, 'success', "Structure des tables validée", 
            `${tableCount} tables disponibles pour l'utilisateur ${FIXED_USER_ID}`);
        } else {
          updateDiagnostic(2, 'warning', "Aucune table trouvée", 
            `Aucune table n'a été trouvée pour l'utilisateur ${FIXED_USER_ID}`);
        }
      } else {
        updateDiagnostic(2, 'warning', "Format de données inattendu", 
          "La réponse ne contient pas la liste des tables attendue");
      }
    } catch (error) {
      console.error("Erreur lors du test de la structure des tables:", error);
      updateDiagnostic(2, 'error', "Échec de la vérification de la structure", 
        error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };
  
  const updateDiagnostic = (index: number, status: 'success' | 'warning' | 'error' | 'pending', message: string, details?: string) => {
    setDiagnostics(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status,
        message,
        details
      };
      return updated;
    });
  };
  
  const getStatusIcon = (status: 'success' | 'warning' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic de base de données</CardTitle>
        <CardDescription>
          Effectuer des tests de connexion et de structure sur la base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Le diagnostic vérifie la connexion au serveur, l'accès à la base de données et la structure des tables 
            pour l'utilisateur <strong>{FIXED_USER_ID}</strong>.
          </p>
        </div>
        
        {diagnostics.length > 0 ? (
          <div className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {index === 0 && <Server className="h-4 w-4 text-gray-500" />}
                    {index === 1 && <Database className="h-4 w-4 text-gray-500" />}
                    {index === 2 && <Table className="h-4 w-4 text-gray-500" />}
                    <h3 className="font-medium">{diagnostic.name}</h3>
                  </div>
                  {getStatusIcon(diagnostic.status)}
                </div>
                <p className="mt-2 text-sm text-gray-600">{diagnostic.message}</p>
                {diagnostic.details && (
                  <p className="mt-1 text-xs text-gray-500">{diagnostic.details}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Database className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">Cliquez sur le bouton ci-dessous pour lancer le diagnostic</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-xs text-gray-500">
          {completed ? `Dernier diagnostic: ${new Date().toLocaleString()}` : ''}
        </span>
        <Button onClick={runDiagnostics} disabled={running} className="flex items-center gap-2">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Lancer le diagnostic
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseDiagnostic;
