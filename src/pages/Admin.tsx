import React from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseConfig } from '@/components/admin/DatabaseConfig';
import { UserManagement } from '@/components/admin/UserManagement';
import { ApiConfiguration } from '@/components/admin/ApiConfiguration';
import { ImageConfiguration } from '@/components/admin/ImageConfiguration';
import { DatabaseDiagnostic } from '@/components/admin/DatabaseDiagnostic';
import { SystemDiagnostic } from '@/components/admin/SystemDiagnostic';
import { DatabaseGuide } from '@/components/admin/DatabaseGuide';

const Admin = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 pb-16 w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Administration</h2>
            <p className="text-muted-foreground">
              Configuration système et gestion des utilisateurs
            </p>
          </div>
          
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="database">Base de données</TabsTrigger>
              <TabsTrigger value="system">Diagnostic système</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="database" className="space-y-6">
              <DatabaseGuide />
              <DatabaseConfig />
              <DatabaseDiagnostic />
            </TabsContent>
            
            <TabsContent value="system" className="space-y-6">
              <SystemDiagnostic />
            </TabsContent>
            
            <TabsContent value="configuration" className="space-y-6">
              <ApiConfiguration />
              <ImageConfiguration />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
