
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, Users, RefreshCw } from "lucide-react";
import { db } from '@/services/database';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const DatabaseDiagnostic = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const { currentUser, userTables, loading, error, refreshUserData } = useCurrentUser();

  const testConnection = async () => {
    setConnectionStatus('loading');
    try {
      const result = await db.testConnection();
      setConnectionStatus(result.success ? 'success' : 'error');
      setConnectionMessage(result.message);
      
      if (result.success) {
        // Charger les utilisateurs si la connexion réussit
        const usersList = await db.getUsers();
        setUsers(usersList);
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnostic de la base de données Infomaniak
          </CardTitle>
          <CardDescription>
            Vérification de la connexion et des données utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Test de connexion:</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testConnection}
              disabled={connectionStatus === 'loading'}
            >
              {connectionStatus === 'loading' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tester
            </Button>
          </div>
          
          {connectionStatus !== 'idle' && (
            <Alert variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
              <div className="flex items-start">
                {connectionStatus === 'success' ? 
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5" /> : 
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                }
                <div>
                  <AlertTitle>{connectionStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
                  <AlertDescription>{connectionMessage}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateur actuel: {currentUser}
          </CardTitle>
          <CardDescription>
            Tables disponibles pour cet utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement des données utilisateur...</p>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div>
              <p className="mb-3">
                <strong>{userTables.length}</strong> tables trouvées pour l'utilisateur <strong>{currentUser}</strong>
              </p>
              {userTables.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {userTables.map((table, index) => (
                    <li key={index} className="text-sm">{table}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Aucune table trouvée pour cet utilisateur.</p>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshUserData}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs dans la base de données</CardTitle>
            <CardDescription>
              {users.length} utilisateurs trouvés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user, index) => (
                <div key={index} className="p-2 bg-muted rounded">
                  <div className="font-medium">{user.identifiant_technique}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.prenom} {user.nom} ({user.email}) - {user.role}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseDiagnostic;
