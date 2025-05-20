
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { UserManagement } from '@/components/admin/UserManagement';
import { DatabaseConfig } from '@/components/admin/DatabaseConfig';
import { SystemDiagnostic } from '@/components/admin/SystemDiagnostic';

const Administration = () => {
  return (
    <DashboardLayout>
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
                <TabsTrigger value="database">Base de données</TabsTrigger>
                <TabsTrigger value="system">Diagnostic système</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>
              <TabsContent value="database">
                <DatabaseConfig />
              </TabsContent>
              <TabsContent value="system">
                <SystemDiagnostic />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-4 text-sm text-gray-500">
            Accès limité aux administrateurs
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Administration;
