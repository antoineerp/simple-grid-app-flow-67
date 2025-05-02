
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApiUrl } from '@/config/apiConfig';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ConnectionDiagnostic = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const apiUrl = getApiUrl();

  const runDiagnostic = async () => {
    setStatus('loading');
    setErrorMessage(null);
    
    try {
      // Test de ping simple
      const pingResponse = await fetch(`${apiUrl}/ping.php`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (!pingResponse.ok) {
        throw new Error(`Erreur de ping: ${pingResponse.status} ${pingResponse.statusText}`);
      }
      
      const pingData = await pingResponse.json();
      
      // Test de base de données simple
      const dbResponse = await fetch(`${apiUrl}/check-users.php`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      const dbData = await dbResponse.json();
      
      setApiResponse({
        ping: pingData,
        database: dbData,
        mimeCheck: {
          status: document.readyState,
          scripts: {
            checkMime: typeof window.checkMimeTypeStatus === 'function' 
                     ? window.checkMimeTypeStatus() 
                     : 'Non chargé'
          }
        }
      });
      
      setStatus('success');
    } catch (error) {
      console.error("Erreur de diagnostic:", error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };
  
  // Exécuter le diagnostic au chargement du composant
  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Diagnostic de connexion
          {status === 'loading' && (
            <span className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
          )}
          {status === 'success' && <CheckCircle className="text-green-500" size={20} />}
          {status === 'error' && <XCircle className="text-red-500" size={20} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {status === 'success' && apiResponse && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Statut du serveur</h3>
              <p>Message: {apiResponse.ping?.message || 'Non disponible'}</p>
              <p>Timestamp: {apiResponse.ping?.timestamp ? new Date(apiResponse.ping.timestamp * 1000).toLocaleString() : 'Non disponible'}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Base de données</h3>
              <p>Statut: {apiResponse.database?.status || 'Non disponible'}</p>
              <p>Utilisateurs: {apiResponse.database?.count || 'Non disponible'}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Vérification des scripts</h3>
              <p>Document ready state: {apiResponse.mimeCheck?.status}</p>
              <p>check-mime.js: {typeof apiResponse.mimeCheck?.scripts.checkMime === 'object' ? 'Chargé' : 'Non chargé'}</p>
            </div>
          </div>
        )}
        
        <Button onClick={runDiagnostic} className="mt-4">
          Relancer le diagnostic
        </Button>
      </CardContent>
    </Card>
  );
};

// Modifié pour être cohérent avec la déclaration dans main.tsx
// en utilisant un modificateur optionnel (?)
declare global {
  interface Window { 
    checkMimeTypeStatus?: () => any;
  }
}

export default ConnectionDiagnostic;
