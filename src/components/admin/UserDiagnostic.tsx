
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getApiUrl } from '@/config/apiConfig';

interface UserDiagnosticResult {
  directory_structure: {
    [key: string]: {
      exists: boolean;
      readable: boolean;
      writable: boolean;
      files?: string[];
    };
  };
  database: {
    class_exists: boolean;
    config: any;
    connected: boolean;
    error: string | null;
    table_exists?: boolean;
    user_count?: number;
    table_structure?: any[];
  };
  user_files: {
    [key: string]: {
      exists: boolean;
      readable: boolean;
      size: number;
    };
  };
  user_test: {
    creation_attempted?: boolean;
    creation_success?: boolean;
    verification?: boolean;
    user_data?: any;
    error?: string;
    trace?: string;
  };
  permissions: {
    php_version: string;
    current_user: string;
    script_owner: any;
    api_dir_writable: boolean;
    error_log_writable: boolean;
  };
}

const UserDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UserDiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/user-diagnostic.php`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non-JSON: ${text.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('Erreur diagnostic utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Diagnostic de création d'utilisateurs</CardTitle>
            <CardDescription>Vérification des composants liés à la création d'utilisateurs</CardDescription>
          </div>
          <Button onClick={runDiagnostic} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Exécuter le diagnostic
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {result && (
          <div className="space-y-6">
            {/* Structure des répertoires */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Structure des répertoires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result.directory_structure).map(([dir, info]) => (
                  <div key={dir} className="border rounded-md p-4">
                    <div className="flex items-center">
                      {info.exists ? 
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> : 
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                      <span className="font-medium">{dir}/</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className={info.readable ? "text-green-600" : "text-red-600"}>
                        Lecture: {info.readable ? "Oui" : "Non"}
                      </p>
                      <p className={info.writable ? "text-green-600" : "text-red-600"}>
                        Écriture: {info.writable ? "Oui" : "Non"}
                      </p>
                      {info.files && (
                        <p>
                          {info.files.length} fichiers trouvés
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Base de données */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Base de données</h3>
              <div className="border rounded-md p-4">
                <div className="flex items-center">
                  {result.database.connected ? 
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> : 
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                  <span className="font-medium">Connexion à la base de données</span>
                </div>
                
                {result.database.config && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Hôte:</span> {result.database.config.host}</p>
                    <p><span className="font-medium">Base:</span> {result.database.config.db_name}</p>
                    <p><span className="font-medium">Utilisateur:</span> {result.database.config.username}</p>
                    <p><span className="font-medium">Source:</span> {result.database.config.source}</p>
                  </div>
                )}
                
                {result.database.table_exists !== undefined && (
                  <div className="mt-2 flex items-center">
                    {result.database.table_exists ? 
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> : 
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    <span>Table "utilisateurs"</span>
                    {result.database.user_count !== undefined && result.database.table_exists && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({result.database.user_count} utilisateurs)
                      </span>
                    )}
                  </div>
                )}
                
                {result.database.error && (
                  <div className="mt-2 text-red-600 text-sm">
                    Erreur: {result.database.error}
                  </div>
                )}
              </div>
            </div>
            
            {/* Fichiers utilisateurs */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Fichiers pour la gestion des utilisateurs</h3>
              <div className="space-y-2">
                {Object.entries(result.user_files).map(([file, info]) => (
                  <div key={file} className="border rounded-md p-3 flex items-center">
                    {info.exists ? 
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> : 
                      <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />}
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{file}</p>
                      {info.exists && (
                        <p className="text-sm text-gray-500">
                          {(info.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      {!info.exists && (
                        <p className="text-sm text-red-600">
                          Fichier manquant
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Test de création d'utilisateur */}
            {result.user_test && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Test de création d'utilisateur</h3>
                <div className="border rounded-md p-4">
                  {result.user_test.creation_attempted && (
                    <div className="flex items-center">
                      {result.user_test.creation_success ? 
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> : 
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                      <span className="font-medium">
                        {result.user_test.creation_success ? "Création réussie" : "Échec de la création"}
                      </span>
                    </div>
                  )}
                  
                  {result.user_test.verification !== undefined && (
                    <div className="mt-2 flex items-center">
                      {result.user_test.verification ? 
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> : 
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                      <span>Vérification après création</span>
                    </div>
                  )}
                  
                  {result.user_test.user_data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                      <p className="font-medium">Données utilisateur créé:</p>
                      <pre className="mt-1 overflow-x-auto">
                        {JSON.stringify(result.user_test.user_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.user_test.error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-md text-sm border border-red-200">
                      <p className="font-medium text-red-700">Erreur:</p>
                      <p className="mt-1 text-red-600">{result.user_test.error}</p>
                      {result.user_test.trace && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-500">Afficher la trace</summary>
                          <pre className="mt-2 p-2 bg-gray-800 text-white text-xs rounded-md overflow-x-auto whitespace-pre-wrap">
                            {result.user_test.trace}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Permissions */}
            {result.permissions && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Informations système</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <p><span className="font-medium">Version PHP:</span> {result.permissions.php_version}</p>
                    <p><span className="font-medium">Utilisateur courant:</span> {result.permissions.current_user}</p>
                    <p><span className="font-medium">Répertoire API inscriptible:</span> {result.permissions.api_dir_writable ? "Oui" : "Non"}</p>
                    <p><span className="font-medium">Log d'erreurs inscriptible:</span> {result.permissions.error_log_writable ? "Oui" : "Non"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDiagnostic;
