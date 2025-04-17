import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import DatabaseInfo from '@/components/admin/DatabaseInfo';
import { getCurrentUser } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from '@/types/roles';

const Administration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getCurrentUser());

  useEffect(() => {
    const userRole = localStorage.getItem('userRole') as UserRole;
    
    if (!hasPermission(userRole, 'accessAdminPanel')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: "destructive",
      });
      navigate('/pilotage');
      return;
    }

    setCurrentDatabaseUser(getCurrentUser());
  }, [navigate, toast]);

  const handleUserConnect = (identifiant: string) => {
    setCurrentDatabaseUser(identifiant);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Administration du système</h1>
      
      {currentDatabaseUser && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium text-blue-800">
            Vous êtes actuellement connecté à la base de données en tant que: <span className="font-bold">{currentDatabaseUser}</span>
          </p>
        </div>
      )}
      
      <Tabs defaultValue="utilisateurs">
        <TabsList className="mb-8">
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilisateurs">
          <UserManagement 
            currentDatabaseUser={currentDatabaseUser} 
            onUserConnect={handleUserConnect}
          />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
