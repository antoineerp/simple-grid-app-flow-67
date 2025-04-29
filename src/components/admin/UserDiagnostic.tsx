
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from "@/hooks/use-toast";

interface DatabaseDiagnosticResult {
  status: 'success' | 'error';
  message: string;
  actions?: string[];
  errors?: string[];
  table_structure?: any[];
  current_roles?: string[];
  missing_roles?: string[];
  existing_role_structure?: string;
}

const UserDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DatabaseDiagnosticResult | null>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/fix-users-roles.php`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      if (data.status === 'success') {
        toast({
          title: "Diagnostic complété",
          description: data.message,
        });
      } else {
        toast({
          title: "Erreur de diagnostic",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      toast({
        title: "Erreur",
        description: "Impossible de compléter le diagnostic",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic des utilisateurs</CardTitle>
        <CardDescription>
          Vérification et correction des problèmes de structure de la table utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            <Alert variant={result.status === 'success' ? 'default' : 'destructive'}>
              {result.status === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {result.actions && result.actions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Actions effectuées:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {result.actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-500 mb-2">Erreurs:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-500">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.current_roles && (
              <div>
                <h4 className="text-sm font-medium mb-2">Rôles disponibles:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.current_roles.map((role, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.existing_role_structure && (
              <div>
                <h4 className="text-sm font-medium mb-2">Structure actuelle du champ rôle:</h4>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {result.existing_role_structure}
                </code>
              </div>
            )}

            {result.table_structure && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Structure de la table:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Champ</th>
                        <th className="border p-2 text-left">Type</th>
                        <th className="border p-2 text-left">Null</th>
                        <th className="border p-2 text-left">Clé</th>
                        <th className="border p-2 text-left">Défaut</th>
                        <th className="border p-2 text-left">Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.table_structure.map((field, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="border p-2">{field.Field}</td>
                          <td className="border p-2">{field.Type}</td>
                          <td className="border p-2">{field.Null}</td>
                          <td className="border p-2">{field.Key}</td>
                          <td className="border p-2">{field.Default || '-'}</td>
                          <td className="border p-2">{field.Extra || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runDiagnostic} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Relancer le diagnostic
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserDiagnostic;
