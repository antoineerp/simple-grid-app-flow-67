
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Database, Server, Users } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAuthHeaders } from '@/services/auth/authService';
import { getUtilisateurs } from '@/services/users/userManager';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Utilisateur } from '@/services';

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
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [fallbackUsers, setFallbackUsers] = useState<FallbackUser[]>([]);
  const [richardUserStatus, setRichardUserStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [richardMessage, setRichardMessage] = useState<string>('');

  const testApiConnection = async () => {
    setApiStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing API connection to:", API_URL);
      
      const response = await fetch(`${API_URL}/test.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("API response:", data);
      
      setApiMessage(`Connexion API réussie (${data.message || 'Pas de message'})`);
      setApiStatus('success');
    } catch (error) {
      console.error("Erreur API:", error);
      setApiMessage(`Échec de la connexion API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setApiStatus('error');
    }
  };

  const testRichardUser = async () => {
    setRichardUserStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Test spécifique de connexion avec p71x6d_richard");
      
      const response = await fetch(`${API_URL}/richard-user-check.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("Richard user test response:", data);
      
      if (data.status === 'success' || data.status === 'warning') {
        setRichardMessage(`Test p71x6d_richard réussi (${data.message}). Table utilisateurs: ${data.tableExists ? 'Existe' : 'N\'existe pas'}`);
        setRichardUserStatus('success');
      } else {
        throw new Error(data.message || 'Échec du test p71x6d_richard');
      }
    } catch (error) {
      console.error("Erreur test p71x6d_richard:", error);
      setRichardMessage(`Échec du test p71x6d_richard: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setRichardUserStatus('error');
    }
  };

  const testDatabaseConnection = async () => {
    setDbStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing database connection using check-users endpoint");
      
      // Utiliser le endpoint des utilisateurs avec p71x6d_richard
      const response = await fetch(`${API_URL}/check-users.php?source=p71x6d_richard`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("Database response:", data);
      
      if (data.status === 'success') {
        setDbMessage(`Connexion DB réussie (${data.message || 'Pas de message'})`);
        setDbStatus('success');
      } else {
        throw new Error(data.message || 'Échec de la connexion à la base de données');
      }
    } catch (error) {
      console.error("Erreur DB:", error);
      setDbMessage(`Échec de la connexion DB: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setDbStatus('error');
    }
  };

  const testUsersConnection = async () => {
    setUsersStatus('loading');
    try {
      // Use the correct function from userManager
      const usersData = await getUtilisateurs(true);
      
      setUsers(usersData);
      setUsersMessage(`Utilisateurs récupérés avec succès (${usersData.length} utilisateurs dans la base)`);
      setUsersStatus('success');
    } catch (error) {
      console.error("Erreur Users:", error);
      setUsersMessage(`Échec de la récupération des utilisateurs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setUsersStatus('error');
      
      setFallbackUsers([
        { identifiant_technique: "admin", mot_de_passe: "admin123", role: "admin" },
        { identifiant_technique: "p71x6d_richard", mot_de_passe: "Trottinette43!", role: "admin" }
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
              Test utilisateur p71x6d_richard:
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testRichardUser} 
              disabled={richardUserStatus === 'loading'}
            >
              {richardUserStatus === 'loading' ? 'Test en cours...' : 'Tester'}
            </Button>
          </div>
          
          {richardUserStatus !== 'idle' && (
            <Alert variant={richardUserStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
              <div className="flex items-start">
                {richardUserStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{richardUserStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{richardMessage}</AlertDescription>
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
