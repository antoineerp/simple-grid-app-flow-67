
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserManagement from '@/components/admin/UserManagement';
import DatabaseConfig from '@/components/admin/DatabaseConfig';
import ApiConfiguration from '@/components/admin/ApiConfiguration';
import SystemDiagnostic from '@/components/admin/SystemDiagnostic';
import { AlertTriangle } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<string>("system");

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administration du système</h1>
        <Button variant="outline" size="sm" className="text-orange-500 border-orange-300">
          <AlertTriangle size={16} className="mr-1" /> 
          Mode administrateur
        </Button>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
        <p className="text-sm text-orange-800">
          <strong>Important :</strong> Ces fonctionnalités sont réservées aux administrateurs 
          système et peuvent affecter le fonctionnement de l'application.
        </p>
      </div>

      <Tabs
        defaultValue="system"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">Diagnostic système</TabsTrigger>
          <TabsTrigger value="database">Configuration BDD</TabsTrigger>
          <TabsTrigger value="api">Configuration API</TabsTrigger>
          <TabsTrigger value="users">Gestion utilisateurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-4">
          <SystemDiagnostic />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseConfig />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiConfiguration />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
