
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTable } from '@/components/users/UsersTable';
import { useUsers } from '@/hooks/useUsers';

const RessourcesHumaines = () => {
  const [activeTab, setActiveTab] = useState('utilisateurs');
  const { users, loading, error } = useUsers();
  
  // Fonction de journalisation d'activité - ajustée pour avoir moins de paramètres
  const logUserActivity = (action: string, details?: string) => {
    console.log(`Activité RH: ${action}`, details || '');
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    logUserActivity('Changement d'onglet', value);
  };
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
          <p className="text-gray-600">Gestion de l'équipe et des ressources humaines</p>
        </div>
        <div>
          <Button variant="default">Nouvel employé</Button>
        </div>
      </div>
      
      <Tabs defaultValue="utilisateurs" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="organigramme">Organigramme</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilisateurs">
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                Gérez tous les utilisateurs de votre organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Chargement des données...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-600">
                  Erreur de chargement des utilisateurs: {error}
                </div>
              ) : (
                <UsersTable users={users} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organigramme">
          <Card>
            <CardHeader>
              <CardTitle>Organigramme de l'organisation</CardTitle>
              <CardDescription>
                Visualisez la structure organisationnelle de votre entreprise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-gray-500">
                Fonctionnalité à venir prochainement.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rapports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports RH</CardTitle>
              <CardDescription>
                Consultez les rapports et statistiques RH.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-gray-500">
                Fonctionnalité à venir prochainement.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RessourcesHumaines;
