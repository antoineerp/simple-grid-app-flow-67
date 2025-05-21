
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from 'lucide-react';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

import ConnectionDiagnostic from '@/components/debug/ConnectionDiagnostic';
import TableDataComparison from '@/components/debug/TableDataComparison';
import UserSyncTester from '@/components/debug/UserSyncTester';
import UserIdChecker from '@/components/debug/UserIdChecker';

/**
 * Page de diagnostic pour tester la synchronisation et les problèmes d'utilisateur
 */
const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('connection');
  const currentUser = getCurrentUser();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-xl font-bold">Diagnostic et tests</h1>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <UserIdChecker />
          <span className="text-muted-foreground">ID actuel: {currentUser}</span>
        </div>
      </div>
      
      <Tabs 
        defaultValue="connection" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="connection">Connexion utilisateur</TabsTrigger>
          <TabsTrigger value="data">Comparaison des données</TabsTrigger>
          <TabsTrigger value="sync">Test multi-utilisateurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <ConnectionDiagnostic />
        </TabsContent>
        
        <TabsContent value="data">
          <TableDataComparison />
        </TabsContent>
        
        <TabsContent value="sync">
          <UserSyncTester />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiagnosticPage;
