
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Database, AlertTriangle, ServerCrash, CheckCircle2 } from 'lucide-react';
import { useAdminDatabase } from '@/hooks/useAdminDatabase';
import DatabaseConfig from './DatabaseConfig';

const DatabaseInfo = () => {
  const { dbInfo, loading, testingConnection, loadDatabaseInfo, handleTestConnection } = useAdminDatabase();
  const [activeTab, setActiveTab] = useState("info");

  const getStatusBadge = (status: string) => {
    if (status === "Online") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {status}
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
          {status}
        </Badge>
      );
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="info">Informations</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
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
            {dbInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Configuration</h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Hôte:</div>
                      <div>{dbInfo.host}</div>
                      <div className="font-medium">Base de données:</div>
                      <div>{dbInfo.database}</div>
                      <div className="font-medium">Statut:</div>
                      <div>
                        {getStatusBadge(dbInfo.status)}
                      </div>
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
