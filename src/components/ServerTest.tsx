
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Database, Server, Users } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAuthHeaders } from '@/services/auth/authService';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
  mot_de_passe?: string;
}

interface FallbackUser {
  identifiant_technique: string;
  mot_de_passe: string;
  role: string;
}

const ServerTest = () => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [usersStatus, setUsersStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string>('');
  const [dbMessage, setDbMessage] = useState<string>('');
  const [usersMessage, setUsersMessage] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [fallbackUsers, setFallbackUsers] = useState<FallbackUser[]>([]);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const validateJsonResponse = (responseText: string): any => {
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Erreur d'analyse JSON:", e);
      console.log("Réponse problématique:", responseText.substring(0, 200));
      
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        const message = "Le serveur a renvoyé une page HTML au lieu de JSON.";
        setErrorDetails(responseText.substring(0, 500));
        throw new Error(message);
      }
      
      throw new Error(`Erreur d'analyse JSON: ${(e as Error).message}`);
    }
  };

  const testApiConnection = async () => {
    setApiStatus('loading');
    setErrorDetails('');
    try {
      const API_URL = getApiUrl();
      console.log("Testing API connection to:", API_URL);
      
      const response = await fetch(`${API_URL}/json-test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      const responseText = await response.text();
      
      // Vérifier que la réponse est bien du JSON
      const contentType = response.headers.get('Content-Type');
      if (contentType && !contentType.includes('application/json')) {
        console.error(`Type de contenu non-JSON reçu: ${contentType}`);
        setErrorDetails(responseText.substring(0, 500));
        throw new Error(`Réponse non-JSON reçue (${contentType})`);
      }
      
      // Parse la réponse JSON
      const data = validateJsonResponse(responseText);
      console.log("API response:", data);
      
      setApiMessage(`Connexion API réussie (${data.message || 'Pas de message'})`);
      setApiStatus('success');
    } catch (error) {
      console.error("Erreur API:", error);
      setApiMessage(`Échec de la connexion API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setApiStatus('error');
      
      toast({
        title: "Erreur de connexion API",
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: "destructive",
      });
    }
  };

  const testDatabaseConnection = async () => {
    setDbStatus('loading');
    setErrorDetails('');
    try {
      const API_URL = getApiUrl();
      console.log("Testing database connection to:", API_URL + '/db-connection-test.php');
      
      const response = await fetch(`${API_URL}/db-connection-test.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      const responseText = await response.text();
      console.log("Réponse brute de la base de données:", responseText.substring(0, 200));
      
      // Vérifier que la réponse est bien du JSON
      const contentType = response.headers.get('Content-Type');
      if (contentType && !contentType.includes('application/json')) {
        console.error(`Type de contenu non-JSON reçu: ${contentType}`);
        setErrorDetails(responseText.substring(0, 500));
        throw new Error(`Réponse non-JSON reçue (${contentType})`);
      }
      
      if (!response.ok) {
        setErrorDetails(responseText.substring(0, 500));
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      // Parse la réponse JSON
      const data = validateJsonResponse(responseText);
      console.log("Database response:", data);
      
      if (data.status === 'success') {
        setDbMessage(`Connexion DB réussie (${data.message || 'Base connectée'})`);
        setDbStatus('success');
      } else {
        setErrorDetails(data.error || 'Pas de détails d\'erreur');
        throw new Error(data.message || 'Erreur de connexion à la base de données');
      }
    } catch (error) {
      console.error("Erreur DB:", error);
      setDbMessage(`Échec de la connexion DB: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setDbStatus('error');
      
      toast({
        title: "Erreur de connexion à la base de données",
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: "destructive",
      });
    }
  };

  const testUsersConnection = async () => {
    setUsersStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing users connection to:", API_URL + '/check-users.php');
      
      const response = await fetch(`${API_URL}/check-users.php`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText.substring(0, 200) + "...");
      
      if (!responseText.trim()) {
        throw new Error("Réponse vide du serveur");
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        throw new Error("La réponse n'est pas au format JSON valide");
      }
      
      console.log("Users response parsed:", data);
      
      if (data.records && Array.isArray(data.records)) {
        setUsers(data.records);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.warn("Format de réponse inattendu:", data);
        setUsers([]);
      }
      
      if (data.fallback_users) {
        setFallbackUsers(data.fallback_users);
      }
      
      const userCount = data.records ? data.records.length : (data.users ? data.users.length : 0);
      setUsersMessage(`Utilisateurs récupérés avec succès (${userCount} utilisateurs dans la base)`);
      setUsersStatus('success');
    } catch (error) {
      console.error("Erreur Users:", error);
      setUsersMessage(`Échec de la récupération des utilisateurs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setUsersStatus('error');
      
      setFallbackUsers([
        { identifiant_technique: "admin", mot_de_passe: "admin123", role: "admin" },
        { identifiant_technique: "antcirier@gmail.com", mot_de_passe: "password123", role: "admin" },
        { identifiant_technique: "p71x6d_system", mot_de_passe: "admin123", role: "admin" }
      ]);
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Test de connexion</CardTitle>
        <CardDescription>Vérifier la connexion au serveur API et à la base de données</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Connexion à l'API:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testApiConnection}
              disabled={apiStatus === 'loading'}
            >
              {apiStatus === 'loading' ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>
          
          {apiStatus !== 'idle' && (
            <Alert variant={apiStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
              <div className="flex items-start">
                {apiStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{apiStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{apiMessage}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Connexion à la base de données:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testDatabaseConnection} 
              disabled={dbStatus === 'loading'}
            >
              {dbStatus === 'loading' ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>
          
          {dbStatus !== 'idle' && (
            <Alert variant={dbStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
              <div className="flex items-start">
                {dbStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{dbStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{dbMessage}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          
          {errorDetails && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-40">
              <p className="font-semibold mb-1">Détails de l'erreur:</p>
              <pre className="whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs disponibles:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testUsersConnection} 
              disabled={usersStatus === 'loading'}
            >
              {usersStatus === 'loading' ? 'Chargement...' : 'Vérifier'}
            </Button>
          </div>
          
          {usersStatus !== 'idle' && (
            <>
              <Alert variant={usersStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
                <div className="flex items-start">
                  {usersStatus === 'success' ? 
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  }
                  <div>
                    <AlertTitle>{usersStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                    <AlertDescription>{usersMessage}</AlertDescription>
                  </div>
                </div>
              </Alert>

              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="database-users">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Utilisateurs de la base de données
                      <Badge variant="outline" className="ml-2">{users.length}</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {users.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {users.map((user, index) => (
                          <div key={index} className="p-2 bg-muted rounded">
                            <div className="flex justify-between">
                              <div className="font-medium">{user.identifiant_technique}</div>
                              <Badge>{user.role}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.prenom} {user.nom} ({user.email})
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Aucun utilisateur trouvé dans la base de données.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fallback-users">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Utilisateurs de secours
                      <Badge variant="outline" className="ml-2">{fallbackUsers.length}</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    {fallbackUsers.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {fallbackUsers.map((user, index) => (
                          <div key={index} className="p-2 bg-muted rounded">
                            <div className="flex justify-between">
                              <div className="font-medium">{user.identifiant_technique}</div>
                              <Badge>{user.role}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Mot de passe: <code className="bg-background px-1 rounded">{user.mot_de_passe}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Aucun utilisateur de secours disponible.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="text-xs text-muted-foreground">
          API URL: {getApiUrl()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ServerTest;
