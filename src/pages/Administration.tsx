
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import DatabaseInfo from '@/components/admin/DatabaseInfo';
import DatabaseDiagnostic from '@/components/admin/DatabaseDiagnostic';
import ApiConfiguration from '@/components/admin/ApiConfiguration';
import ServerTest from '@/components/ServerTest';
import ImageConfiguration from '@/components/admin/ImageConfiguration';
import { getDatabaseConnectionCurrentUser } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from '@/types/roles';
import UserDiagnostic from '@/components/admin/UserDiagnostic';
import ManagerDataImport from '@/components/admin/ManagerDataImport';
import { getUtilisateurs } from '@/services/users/userService';

const Administration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getDatabaseConnectionCurrentUser());
  const [hasManager, setHasManager] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole') as UserRole;
    console.log("Current user role:", userRole);
    
    // Vérification plus permissive pour l'accès à la page d'administration
    if (!userRole || (userRole !== 'administrateur' && userRole !== 'admin')) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: "destructive",
      });
      navigate('/pilotage');
      return;
    }

    setCurrentDatabaseUser(getDatabaseConnectionCurrentUser());
    
    // Vérifier s'il y a un gestionnaire dans le système
    const checkForManager = async () => {
      try {
        const users = await getUtilisateurs();
        const managerExists = users.some(user => user.role === 'gestionnaire');
        setHasManager(managerExists);
      } catch (error) {
        console.error("Erreur lors de la vérification des gestionnaires:", error);
      }
    };
    
    checkForManager();
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
          <TabsTrigger value="api">Configuration API</TabsTrigger>
          <TabsTrigger value="systeme">État du système</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilisateurs">
          <UserManagement 
            currentDatabaseUser={currentDatabaseUser} 
            onUserConnect={handleUserConnect}
          />
          <div className="mt-6">
            <UserDiagnostic />
          </div>
        </TabsContent>

        <TabsContent value="database">
          <DatabaseInfo />
        </TabsContent>
        
        <TabsContent value="api">
          <ApiConfiguration />
        </TabsContent>

        <TabsContent value="systeme">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">État du système</h3>
              <p className="text-sm text-muted-foreground">Vérifiez l'état des différents composants du système</p>
            </div>
            <div className="p-6 pt-0">
              <ServerTest />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="images">
          <ImageConfiguration />
        </TabsContent>

        <TabsContent value="diagnostic">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Diagnostic complet du système</h3>
              <p className="mb-6 text-muted-foreground">
                Cet outil effectue une analyse approfondie de votre configuration système pour identifier les problèmes potentiels.
              </p>
              <div className="space-y-6">
                <DatabaseDiagnostic />
                <UserDiagnostic />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="sync">
          <div className="space-y-6">
            <ManagerDataImport hasManager={hasManager} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Administration;
