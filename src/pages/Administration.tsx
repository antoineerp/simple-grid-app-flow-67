
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SyncDiagnosticPanel from '@/components/diagnostics/SyncDiagnosticPanel';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { UserCog, Settings, Database, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const Administration: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getDatabaseConnectionCurrentUser());

  // Rediriger si l'utilisateur n'est pas admin
  if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'administrateur'))) {
    return <Navigate to="/" replace />;
  }

  // Afficher un indicateur de chargement pendant la vérification des droits
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleUserConnect = (identifiant: string) => {
    setCurrentDatabaseUser(identifiant);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administration du système</h1>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Données
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserManagement 
            currentDatabaseUser={currentDatabaseUser} 
            onUserConnect={handleUserConnect} 
          />
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>État du système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-medium">Informations</h3>
                  <p className="text-sm text-gray-500">
                    Version: 1.0.0
                  </p>
                  <p className="text-sm text-gray-500">
                    Base de données: Infomaniak MySQL
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Actions système</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      Vérifier les mises à jour
                    </Button>
                    <Button variant="outline" size="sm">
                      Nettoyer le cache
                    </Button>
                    <Button variant="outline" size="sm">
                      Tester la connexion API
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <SyncDiagnosticPanel />
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-medium">Tables</h3>
                  <p className="text-sm text-gray-500">
                    Table principale: utilisateurs
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Actions sur les données</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      Vérifier l'intégrité
                    </Button>
                    <Button variant="outline" size="sm">
                      Exporter les données
                    </Button>
                    <Button variant="destructive" size="sm">
                      Réinitialiser la base
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
