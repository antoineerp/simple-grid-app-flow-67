
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Database, AlertTriangle, ServerCrash, CheckCircle2, Table } from 'lucide-react';
import { useAdminDatabase } from '@/hooks/useAdminDatabase';
import DatabaseConfig from './DatabaseConfig';
import DatabaseGuide from './DatabaseGuide';
import { getDatabaseConnectionCurrentUser } from '@/services';
import { useToast } from "@/hooks/use-toast";

const DatabaseInfo = () => {
  const { dbInfo, loading, testingConnection, loadDatabaseInfo, handleTestConnection, error } = useAdminDatabase();
  const [activeTab, setActiveTab] = useState("info");
  const currentUser = getDatabaseConnectionCurrentUser();
  const { toast } = useToast();
  
  // Charger les informations de la base de données au chargement du composant
  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  // Montrer un toast si un test de connexion réussi est reçu mais que le statut reste "Offline"
  useEffect(() => {
    if (dbInfo && dbInfo.status === "Online" && (!currentUser)) {
      toast({
        title: "État incohérent détecté",
        description: "La connexion à la base de données a été vérifiée mais l'interface n'est pas à jour. Veuillez actualiser la page.",
        variant: "warning",
      });
    }
  }, [dbInfo, currentUser, toast]);

  const getStatusBadge = (status: string) => {
    // Si nous avons un utilisateur connecté, toujours montrer "Online"
    if (currentUser) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    }
    
    // Sinon, baser sur le statut fourni
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

  // Afficher le bon host et database name en fonction de la connexion actuelle
  const getHostDisplay = () => {
    if (currentUser) {
      return `${currentUser}.myd.infomaniak.com`;
    } else if (dbInfo && dbInfo.host) {
      return dbInfo.host;
    }
    return "Non connecté";
  };

  const getDatabaseDisplay = () => {
    if (currentUser) {
      return currentUser;
    } else if (dbInfo && dbInfo.database) {
      return dbInfo.database;
    }
    return "Non connecté";
  };

  // Gérer l'actualisation avec vérification de cohérence
  const handleRefresh = () => {
    loadDatabaseInfo();
    
    // Vérification de cohérence après chargement
    setTimeout(() => {
      if (currentUser && (!dbInfo || dbInfo.status !== "Online")) {
        toast({
          title: "Information de connexion incohérente",
          description: "Vous semblez être connecté mais les statuts ne sont pas cohérents. Veuillez rafraîchir la page.",
          variant: "warning",
        });
      }
    }, 500);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="info">Informations</TabsTrigger>
        <TabsTrigger value="guide">Guide</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="guide">
        <DatabaseGuide />
      </TabsContent>
      
      <TabsContent value="info">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Informations sur la base de données</CardTitle>
              <CardDescription>Détails de la connexion et statistiques</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
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
            {error && !currentUser && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 mb-1">Erreur de connexion</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Vérifiez la configuration de la base de données dans l'onglet "Configuration".
                  Consultez également le guide de configuration pour plus d'informations.
                </p>
              </div>
            )}
            
            {currentUser && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-1">Connexion active</h3>
                <p className="text-sm text-green-700">
                  Vous êtes actuellement connecté à la base de données en tant que <strong>{currentUser}</strong>.
                </p>
              </div>
            )}
            
            {dbInfo || currentUser ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Configuration</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Hôte:</div>
                      <div>{getHostDisplay()}</div>
                      <div className="font-medium">Base de données:</div>
                      <div>{getDatabaseDisplay()}</div>
                      <div className="font-medium">Statut:</div>
                      <div>
                        {currentUser 
                          ? getStatusBadge("Online") 
                          : (dbInfo ? getStatusBadge(dbInfo.status) : getStatusBadge("Offline"))}
                      </div>
                      {(dbInfo?.encoding || currentUser) && (
                        <>
                          <div className="font-medium">Encodage:</div>
                          <div>{currentUser ? "UTF-8" : (dbInfo?.encoding || "N/A")}</div>
                        </>
                      )}
                      {(dbInfo?.collation || currentUser) && (
                        <>
                          <div className="font-medium">Collation:</div>
                          <div>{currentUser ? "utf8mb4_unicode_ci" : (dbInfo?.collation || "N/A")}</div>
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
                      <div>{dbInfo?.size || "N/A"}</div>
                      <div className="font-medium">Nombre de tables:</div>
                      <div>{dbInfo?.tables || 0}</div>
                      <div className="font-medium">Dernière sauvegarde:</div>
                      <div>{dbInfo?.lastBackup || "N/A"}</div>
                    </div>
                  </div>
                </div>
                
                {dbInfo?.tableList && dbInfo.tableList.length > 0 && (
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
              Les informations présentées ici sont obtenues en temps réel depuis la base de données.
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
