
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const Admin = () => {
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(
    getDatabaseConnectionCurrentUser()
  );

  const handleUserConnect = (identifiant: string) => {
    setCurrentDatabaseUser(identifiant);
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>Gérez les paramètres de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList className="mb-4">
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="system">Système</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserManagement 
                currentDatabaseUser={currentDatabaseUser}
                onUserConnect={handleUserConnect}
              />
            </TabsContent>
            <TabsContent value="system">
              <div className="p-4 text-center text-muted-foreground">
                Diagnostic système à venir
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
