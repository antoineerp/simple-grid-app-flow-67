
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SyncDiagnosticPanel from '@/components/diagnostics/SyncDiagnosticPanel';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { UserCog, Settings, Database, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Administration: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('system');

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administration du système</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link to="/user-management">
              <Users className="mr-2 h-4 w-4" />
              Gestion des utilisateurs
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Données
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="mr-2 h-4 w-4" />
            Accès
          </TabsTrigger>
        </TabsList>
        
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
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des accès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-medium">Rôles système</h3>
                  <p className="text-sm text-gray-500">
                    Les rôles système définissent les permissions des utilisateurs.
                  </p>
                  <div className="mt-2">
                    <p><strong>Administrateur:</strong> Accès complet à toutes les fonctionnalités.</p>
                    <p><strong>Gestionnaire:</strong> Peut gérer les utilisateurs et leur contenu.</p>
                    <p><strong>Utilisateur:</strong> Accès limité à son propre contenu.</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Actions d'administration</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="default" size="sm" asChild>
                      <Link to="/user-management">
                        Gérer les utilisateurs
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      Journal d'activité
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
