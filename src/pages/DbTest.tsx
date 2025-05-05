
import DbConnectionTest from '@/components/DbConnectionTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from '@/config/apiConfig';

export default function DbTest() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Test de connexion à la base de données</h1>
        <p className="text-muted-foreground">
          Cette page permet de tester directement la connexion à la base de données MySQL Infomaniak
        </p>
      </div>
      
      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">Test direct</TabsTrigger>
          <TabsTrigger value="info">Informations de connexion</TabsTrigger>
        </TabsList>
        <TabsContent value="direct" className="mt-4">
          <DbConnectionTest />
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de connexion</CardTitle>
              <CardDescription>
                Paramètres de connexion à la base de données MySQL Infomaniak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded">
                    <h3 className="font-medium">Hôte</h3>
                    <p className="font-mono text-sm">p71x6d.myd.infomaniak.com</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <h3 className="font-medium">Base de données</h3>
                    <p className="font-mono text-sm">p71x6d_system</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <h3 className="font-medium">Utilisateur</h3>
                    <p className="font-mono text-sm">p71x6d_system</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <h3 className="font-medium">API URL</h3>
                    <p className="font-mono text-sm">{getApiUrl()}</p>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded">
                  <h3 className="font-medium">Test direct via navigateur</h3>
                  <p className="text-sm mb-2">
                    Vous pouvez accéder directement au script de test via l'URL suivante:
                  </p>
                  <a 
                    href={`${getApiUrl()}/direct-db-test.php`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-mono break-all"
                  >
                    {getApiUrl()}/direct-db-test.php
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
