
import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Database as DatabaseIcon, Server, Settings } from 'lucide-react';

const Database = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Administration de la Base de données</h1>

        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">
              <Server className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="diagnostic">
              <DatabaseIcon className="h-4 w-4 mr-2" />
              Diagnostic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Statut de la base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="font-medium text-green-700">Connexion</div>
                      <div className="text-green-600 text-sm">Connecté</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="font-medium text-green-700">Type</div>
                      <div className="text-green-600 text-sm">MySQL</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="font-medium text-green-700">Version</div>
                      <div className="text-green-600 text-sm">5.7.38</div>
                    </div>
                  </div>

                  <Button>Vérifier la connexion</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de la base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Configuration de la base de données...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostic">
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic de la base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Outils de diagnostic de la base de données...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Database;
