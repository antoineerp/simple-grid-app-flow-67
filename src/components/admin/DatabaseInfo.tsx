
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Database, AlertTriangle, ServerCrash, CheckCircle2, Table, Stethoscope } from 'lucide-react';
import { useAdminDatabase } from '@/hooks/useAdminDatabase';
import DatabaseConfig from './DatabaseConfig';
import DatabaseGuide from './DatabaseGuide';
import DatabaseDiagnostic from './DatabaseDiagnostic';

// ID utilisateur fixe pour toute l'application
const FIXED_USER_ID = 'p71x6d_richard';

const DatabaseInfo = () => {
  const { dbInfo, loading, testingConnection, loadDatabaseInfo, handleTestConnection, error } = useAdminDatabase();
  const [activeTab, setActiveTab] = useState("info");
  
  // Charger les informations de la base de données au chargement du composant
  useEffect(() => {
    loadDatabaseInfo();
    
    // Recharger les informations toutes les 60 secondes
    const interval = setInterval(() => {
      loadDatabaseInfo();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "Online") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    } else if (status === "Warning") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <ServerCrash className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      );
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="info">Informations</TabsTrigger>
        <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        <TabsTrigger value="guide">Guide</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="guide">
        <DatabaseGuide />
      </TabsContent>
      
      <TabsContent value="diagnostic">
        <DatabaseDiagnostic />
      </TabsContent>
      
      <TabsContent value="info">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Informations sur la base de données</CardTitle>
              <CardDescription>Détails de la connexion et statistiques</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadDatabaseInfo} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Actualiser</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testingConnection}>
                {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                <span className="ml-2">Tester la connexion</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Note importante</h3>
                <p className="text-sm text-yellow-700">
                  Cette application utilise toujours la base de données <strong>{FIXED_USER_ID}</strong> 
                  pour des raisons de compatibilité.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("diagnostic")} className="flex items-center text-yellow-700">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    Exécuter un diagnostic complet
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Connexion active</h3>
              <p className="text-sm text-green-700">
                Vous êtes actuellement connecté à la base de données en tant que <strong>{FIXED_USER_ID}</strong>.
              </p>
            </div>
            
            {dbInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Configuration</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Hôte:</div>
                      <div>{`${FIXED_USER_ID}.myd.infomaniak.com`}</div>
                      <div className="font-medium">Base de données:</div>
                      <div>{FIXED_USER_ID}</div>
                      <div className="font-medium">Statut:</div>
                      <div>
                        {getStatusBadge("Online")}
                      </div>
                      {dbInfo.encoding && (
                        <>
                          <div className="font-medium">Encodage:</div>
                          <div>UTF-8</div>
                        </>
                      )}
                      {dbInfo.collation && (
                        <>
                          <div className="font-medium">Collation:</div>
                          <div>utf8mb4_unicode_ci</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Statistiques</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Taille totale:</div>
                      <div>{dbInfo.size}</div>
                      <div className="font-medium">Nombre de tables:</div>
                      <div>{dbInfo.tables}</div>
                      <div className="font-medium">Dernière sauvegarde:</div>
                      <div>{dbInfo.lastBackup}</div>
                    </div>
                  </div>
                </div>
                
                {dbInfo.tableList && dbInfo.tableList.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Tables de la base de données</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {dbInfo.tableList.map((table, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                        >
                          <Table className="h-4 w-4 text-slate-500" />
                          <span className="text-sm truncate">{table}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Toujours connecté à la base de données {FIXED_USER_ID}
            </p>
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour: {new Date().toLocaleString()}
            </p>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="config">
        <DatabaseConfig />
      </TabsContent>
    </Tabs>
  );
};

export default DatabaseInfo;
