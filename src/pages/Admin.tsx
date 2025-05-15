
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import DatabaseInfo from '@/components/admin/DatabaseInfo';
import DatabaseConnectionForm from '@/components/admin/DatabaseConnectionForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getDatabaseConnectionCurrentUser } from '@/services';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const AdminPage = () => {
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState<boolean>(false);
  
  useEffect(() => {
    const user = getDatabaseConnectionCurrentUser();
    setCurrentDatabaseUser(user);
  }, []);
  
  const handleUserConnect = (identifiant: string) => {
    setCurrentDatabaseUser(identifiant);
  };
  
  const handleConfigurationSaved = () => {
    // Recharger la page pour appliquer les nouvelles configurations
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Administration</h1>
      
      <Tabs defaultValue="database">
        <TabsList className="mb-6">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement 
            currentDatabaseUser={currentDatabaseUser} 
            onUserConnect={handleUserConnect} 
          />
        </TabsContent>
        
        <TabsContent value="database">
          <div className="space-y-6">
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
                  <button
                    onClick={() => setShowConnectionForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Configurer la connexion à la base de données
                  </button>
                )}
              </CardContent>
            </Card>
            
            <DatabaseInfo />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
