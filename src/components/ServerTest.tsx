
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import ApiStatusSection from "./server-test/ApiStatusSection";
import DatabaseStatusSection from "./server-test/DatabaseStatusSection";
import UserTestSection from "./server-test/UserTestSection";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
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

  const testApiConnection = async () => {
    setApiStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing API connection to:", API_URL);
      
      const data = await fetchWithErrorHandling(`${API_URL}/test.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log("API response:", data);
      
      setApiMessage(`Connexion API réussie (${data.message || 'Pas de message'})`);
      setApiStatus('success');
    } catch (error) {
      console.error("Erreur API:", error);
      setApiMessage(`Échec de la connexion API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setApiStatus('error');
    }
  };

  const testDatabaseConnection = async () => {
    setDbStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing database connection to:", API_URL + '/db-connection-test.php');
      
      const data = await fetchWithErrorHandling(`${API_URL}/db-connection-test.php`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log("Database response:", data);
      
      setDbMessage(`Connexion DB réussie (${data.message || 'Pas de message'})`);
      setDbStatus('success');
    } catch (error) {
      console.error("Erreur DB:", error);
      setDbMessage(`Échec de la connexion DB: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setDbStatus('error');
    }
  };

  const testUsersConnection = async () => {
    setUsersStatus('loading');
    try {
      const API_URL = getApiUrl();
      console.log("Testing users connection to:", API_URL + '/check-users.php');
      
      const data = await fetchWithErrorHandling(`${API_URL}/check-users.php`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log("Users response:", data);
      
      if (data.records) {
        setUsers(data.records);
      }
      
      if (data.fallback_users) {
        setFallbackUsers(data.fallback_users);
      }
      
      setUsersMessage(`Utilisateurs récupérés avec succès (${data.count || 0} utilisateurs dans la base)`);
      setUsersStatus('success');
    } catch (error) {
      console.error("Erreur Users:", error);
      setUsersMessage(`Échec de la récupération des utilisateurs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setUsersStatus('error');
      
      setFallbackUsers([
        { identifiant_technique: "admin", mot_de_passe: "admin123", role: "admin" },
        { identifiant_technique: "antcirier@gmail.com", mot_de_passe: "password123", role: "admin" },
        { identifiant_technique: "p71x6d_system", mot_de_passe: "admin123", role: "admin" },
        { identifiant_technique: "p71x6d_dupont", mot_de_passe: "manager456", role: "gestionnaire" },
        { identifiant_technique: "p71x6d_martin", mot_de_passe: "user789", role: "utilisateur" }
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
        <ApiStatusSection
          apiStatus={apiStatus}
          apiMessage={apiMessage}
          onTest={testApiConnection}
        />
        <DatabaseStatusSection
          dbStatus={dbStatus}
          dbMessage={dbMessage}
          onTest={testDatabaseConnection}
        />
        <UserTestSection
          usersStatus={usersStatus}
          usersMessage={usersMessage}
          users={users}
          fallbackUsers={fallbackUsers}
          onTest={testUsersConnection}
        />
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
