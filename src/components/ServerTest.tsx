
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Server } from 'lucide-react';
import { testApiConnection, getFullApiUrl } from '@/config/apiConfig';
import { Utilisateur } from '@/types/user';
import { UserManager } from '@/services/users/userManager';

const ServerTest = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [users, setUsers] = useState<Utilisateur[]>([]);
  
  const handleTest = async () => {
    try {
      setStatus('loading');
      setMessage('Test du serveur en cours...');
      
      const result = await testApiConnection();
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Connexion réussie au serveur');
        
        // Essayer de charger la liste des utilisateurs
        try {
          const data = await UserManager.getUtilisateurs(true);
          setUsers(data || []);
        } catch (userError) {
          console.error("Impossible de charger les utilisateurs", userError);
        }
      } else {
        setStatus('error');
        setMessage(result.message || 'Erreur lors de la connexion au serveur');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  useEffect(() => {
    // Au chargement du composant, effectuer un test automatique
    handleTest();
  }, []);
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="h-5 w-5 mr-2" />
          Test de connexion au serveur
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {status === 'loading' && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {status === 'success' && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Connexion réussie</AlertTitle>
            <AlertDescription className="text-green-700">
              {message}
              <div className="mt-2">
                <span className="font-semibold">URL d'API:</span> {getFullApiUrl()}
              </div>
              {users.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-1">{users.length} utilisateurs chargés:</p>
                  <ul className="text-xs bg-white p-2 rounded max-h-32 overflow-y-auto border border-green-100">
                    {users.map((user, index) => (
                      <li key={user.id || index} className="border-b border-green-50 last:border-0 py-1">
                        {user.prenom} {user.nom} - {user.email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription>
              {message}
              <div className="mt-2">
                <span className="font-semibold">URL d'API:</span> {getFullApiUrl()}
              </div>
              <div className="mt-2 text-xs bg-red-50 p-2 rounded">
                Vérifiez que le serveur est accessible et que la configuration de l'API est correcte.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleTest}
          disabled={status === 'loading'}
          variant="outline" 
          className="w-full"
        >
          {status === 'loading' ? 'Test en cours...' : 'Tester à nouveau'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServerTest;
