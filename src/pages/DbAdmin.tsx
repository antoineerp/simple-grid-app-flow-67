
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServerTestComponent from '@/components/dbadmin/ServerTest';
import DatabaseStatsComponent from '@/components/dbadmin/DatabaseStats';
import SyncTester from '@/components/common/SyncTester';

const DbAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('server-test');

  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administration de la base de données</CardTitle>
          <CardDescription>
            Outils de gestion et diagnostic de la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="server-test">Tests serveur</TabsTrigger>
              <TabsTrigger value="db-stats">Statistiques</TabsTrigger>
              <TabsTrigger value="sync-test">Test de synchronisation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="server-test" className="space-y-4">
              <ServerTestComponent />
            </TabsContent>
            
            <TabsContent value="db-stats" className="space-y-4">
              <DatabaseStatsComponent />
            </TabsContent>
            
            <TabsContent value="sync-test" className="space-y-4">
              <SyncTester />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DbAdmin;
