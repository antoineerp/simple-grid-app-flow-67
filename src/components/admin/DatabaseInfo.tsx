
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDatabaseInfo, testDatabaseConnection } from '@/services';

const DatabaseInfo = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier d'abord la connexion
      const isConnected = await testDatabaseConnection();
      setConnected(isConnected);
      
      if (isConnected) {
        // Récupérer les informations de la base de données
        const info = await getDatabaseInfo();
        if (info && !info.error) {
          setDbInfo(info);
        } else {
          setError(info.error || "Impossible de récupérer les informations de la base de données");
        }
      } else {
        setError("La connexion à la base de données a échoué");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des informations de la base de données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Informations de la base de données</CardTitle>
          <CardDescription>Détails de la connexion et configuration MySQL</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDatabaseInfo} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {connected === true && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>Connexion à la base de données établie avec succès</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="animate-spin h-6 w-6 text-blue-500" />
            <span className="ml-2">Chargement des informations...</span>
          </div>
        ) : (
          dbInfo && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Base de données: {dbInfo.database_name}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Version MySQL</h3>
                  <p>{dbInfo.mysql_version || "Information non disponible"}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Serveur</h3>
                  <p>{dbInfo.server || "Information non disponible"}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Utilisateur</h3>
                  <p>{dbInfo.user || "Information non disponible"}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Jeu de caractères</h3>
                  <p>{dbInfo.charset || "UTF-8 (par défaut)"}</p>
                </div>
              </div>
              
              {dbInfo.tables && dbInfo.tables.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Tables ({dbInfo.tables.length})</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lignes</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dbInfo.tables.map((table: any, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-2 text-sm">{table.name}</td>
                            <td className="px-4 py-2 text-sm">{table.rows || '0'}</td>
                            <td className="px-4 py-2 text-sm">{table.size || '0 KB'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseInfo;
