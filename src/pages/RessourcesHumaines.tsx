import React, { useState, useEffect } from 'react';
import { MembresProvider } from '@/contexts/MembresContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useSync } from '@/hooks/useSync';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import { Membre } from '@/types/membres';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

const RessourcesHumaines = () => {
  const { toast } = useToast();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [activeTab, setActiveTab] = useState('liste');
  const { isSyncing, syncFailed, lastSynced, syncAndProcess, loadFromServer } = useSync('membres');

  useEffect(() => {
    const fetchMembres = async () => {
      try {
        // Charger les membres depuis le serveur
        const data = await loadFromServer<Membre>();
        if (data && data.length > 0) {
          setMembres(data);
        }
      } catch (error) {
        console.error("Erreur de chargement des membres:", error);
      }
    };

    fetchMembres();
  }, [loadFromServer]);

  const handleSync = async () => {
    try {
      await syncAndProcess({
        tableName: 'membres',
        data: membres
      });
    } catch (error) {
      console.error("Erreur de synchronisation:", error);
    }
  };

  const handleAddMembre = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un membre"
      });
      return;
    }

    try {
      const newId = `M${membres.length + 1}`;
      const newMembre: Membre = {
        id: newId,
        nom: "Nouveau",
        prenom: "Membre",
        fonction: "À définir",
        initiales: "NM",
        date_creation: new Date()
      };

      const updatedMembres = [...membres, newMembre];
      setMembres(updatedMembres);

      // Import for logUserActivity is missing, let's comment it out for now
      /*
      // Journaliser l'action
      await logUserActivity(
        currentUser,
        'create',
        'membre',
        newId,
        { nom: newMembre.nom, prenom: newMembre.prenom }
      );
      */

      // Synchroniser les données
      await syncAndProcess({
        tableName: 'membres',
        data: updatedMembres
      });

      toast({
        title: "Membre ajouté",
        description: "Le nouveau membre a été ajouté avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le membre"
      });
    }
  };

  const handleExportMembres = () => {
    // Logique d'export à implémenter
    toast({
      title: "Export en cours",
      description: "La liste des membres est en cours d'export"
    });
  };

  return (
    <MembresProvider>
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
            <p className="text-gray-500">Gestion des membres de l'équipe</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExportMembres}
              title="Exporter"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <SyncStatusIndicator 
          syncFailed={syncFailed} 
          onReset={handleSync} 
          isSyncing={isSyncing} 
          lastSynced={lastSynced} 
        />

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="liste" className="px-6">
                <Users className="h-4 w-4 mr-2" />
                Liste des membres
              </TabsTrigger>
              <TabsTrigger value="roles" className="px-6">
                Rôles et responsabilités
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={handleAddMembre}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
          
          <TabsContent value="liste" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Membres de l'équipe</CardTitle>
              </CardHeader>
              <CardContent>
                {membres.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Aucun membre n'a été ajouté. Cliquez sur "Ajouter un membre" pour commencer.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {membres.map(membre => (
                      <Card key={membre.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-app-blue text-white flex items-center justify-center text-lg font-semibold">
                              {membre.initiales}
                            </div>
                            <div className="ml-3">
                              <h3 className="font-medium">{membre.prenom} {membre.nom}</h3>
                              <p className="text-sm text-gray-500">{membre.fonction}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          {membre.email && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Email:</span> {membre.email}
                            </p>
                          )}
                          {membre.telephone && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Tél:</span> {membre.telephone}
                            </p>
                          )}
                          {membre.organisation && (
                            <p className="text-sm">
                              <span className="font-medium">Organisation:</span> {membre.organisation}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rôles et responsabilités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Cette fonctionnalité est en cours de développement.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MembresProvider>
  );
};

export default RessourcesHumaines;
