
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SyncDiagnosticPanel from '@/components/diagnostics/SyncDiagnosticPanel';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { UserCog, Settings, Database, Users } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import DatabaseInfo from '@/components/admin/DatabaseInfo';
import DatabaseConnectionForm from '@/components/admin/DatabaseConnectionForm';
import DatabaseDiagnostic from '@/components/admin/DatabaseDiagnostic';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const Administration: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getDatabaseConnectionCurrentUser());
  const [showConnectionForm, setShowConnectionForm] = useState<boolean>(false);
  
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
  
  const handleConfigurationSaved = () => {
    // Recharger la page pour appliquer les nouvelles configurations
    window.location.reload();
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
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Base de données
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
        
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la Base de Données</CardTitle>
              <CardDescription>
                Gérez la connexion à votre base de données MySQL Infomaniak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {showConnectionForm ? (
                  "Modifiez les paramètres de connexion à la base de données ci-dessous:"
                ) : (
                  "Pour configurer la connexion à la base de données, vous devez spécifier les informations de connexion MySQL fournies par Infomaniak."
                )}
              </p>
              
              {showConnectionForm ? (
                <DatabaseConnectionForm onConfigurationSaved={handleConfigurationSaved} />
              ) : (
                <Button
                  onClick={() => setShowConnectionForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Configurer la connexion à la base de données
                </Button>
              )}
            </CardContent>
          </Card>
          
          <DatabaseInfo />
          <DatabaseDiagnostic />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
