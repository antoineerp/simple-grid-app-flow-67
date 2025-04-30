import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import DatabaseInfo from '@/components/admin/DatabaseInfo';
import DatabaseDiagnostic from '@/components/admin/DatabaseDiagnostic';
import ApiConfiguration from '@/components/admin/ApiConfiguration';
import ServerTest from '@/components/ServerTest';
import ImageConfiguration from '@/components/admin/ImageConfiguration';
import { getDatabaseConnectionCurrentUser, initializeCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from "@/hooks/use-toast";
import { hasPermission, UserRole } from '@/types/roles';
import UserDiagnostic from '@/components/admin/UserDiagnostic';
import ManagerDataImport from '@/components/admin/ManagerDataImport';
import { UserManager } from '@/services/users/userManager';
import { SyncDiagnosticPanel } from '@/components/diagnostics/SyncDiagnosticPanel';
import DbConnectionTest from "@/components/DbConnectionTest";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getCurrentUser } from '@/services/auth/authService';

const Administration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getDatabaseConnectionCurrentUser());
  const [hasManager, setHasManager] = useState(false);

  useEffect(() => {
    console.log("Administration: vérification des permissions...");
    
    // Initialiser l'utilisateur de la base de données
    initializeCurrentUser();
    
    // Obtenez le rôle directement de localStorage et utilisez getCurrentUser comme fallback
    let userRole = localStorage.getItem('userRole') as UserRole;
    
    if (!userRole) {
      const currentUser = getCurrentUser();
      userRole = (currentUser?.role || 'utilisateur') as UserRole;
      console.log("Rôle récupéré depuis getCurrentUser:", userRole);
      
      // Stocker le rôle pour les futures vérifications
      if (userRole) {
        localStorage.setItem('userRole', userRole);
      }
    } else {
      console.log("Rôle récupéré depuis localStorage:", userRole);
    }
    
    console.log("Vérification d'accès avec le rôle:", userRole);
    
    if (!hasPermission(userRole, 'accessAdminPanel')) {
      console.log("Accès refusé à l'administration pour le rôle:", userRole);
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: "destructive",
      });
      navigate('/pilotage');
      return;
    } else {
      console.log("Accès autorisé à l'administration pour le rôle:", userRole);
    }

    setCurrentDatabaseUser(getDatabaseConnectionCurrentUser());
    
    // Vérifier s'il y a un gestionnaire dans le système
    const checkForManager = async () => {
      try {
        const managerExists = await UserManager.hasUserWithRole('gestionnaire');
        setHasManager(managerExists);
      } catch (error) {
        console.error("Erreur lors de la vérification des gestionnaires:", error);
      }
    };
    
    checkForManager();
    
    // Ajouter un écouteur d'événements pour les changements d'utilisateur
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.user) {
        setCurrentDatabaseUser(customEvent.detail.user);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    // Nettoyage
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
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
            <Card>
              <CardHeader>
                <CardTitle>Test de connexion à la base de données</CardTitle>
                <CardDescription>Vérifier la connexion au serveur Infomaniak</CardDescription>
              </CardHeader>
              <CardContent>
                <DbConnectionTest />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic de synchronisation</CardTitle>
                <CardDescription>Vérifier l'état de synchronisation et forcer la synchronisation des données</CardDescription>
              </CardHeader>
              <CardContent>
                <SyncDiagnosticPanel onClose={() => {}} />
              </CardContent>
            </Card>
            
            <ManagerDataImport hasManager={hasManager} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Administration;
