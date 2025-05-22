
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, UserPlus } from 'lucide-react';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddUserForm from '@/components/users/AddUserForm';

const Members = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fonction pour charger les membres depuis le serveur
  const loadMembersFromServer = async () => {
    try {
      setIsLoading(true);
      
      const apiUrl = getApiUrl();
      const userId = getCurrentUser();
      
      console.log(`Tentative de chargement des membres depuis ${apiUrl}/users.php`);
      
      const response = await fetch(`${apiUrl}/users.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'User-Agent': 'FormaCert-App/1.0 (Chargement; QualiAPI)'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log(`Réponse brute (premiers 100 caractères): ${responseText.substring(0, 100)}`);
      
      // Vérifier si la réponse est du PHP ou HTML au lieu de JSON
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Données brutes:", data);
      
      let membersList = [];
      
      // Traitement flexible de différents formats de réponse
      if (data.status === 'success' && data.records) {
        membersList = data.records;
      } else if (data.status === 'success' && data.data && data.data.records) {
        membersList = data.data.records;
      } else if (data.records) {
        membersList = data.records;
      } else if (Array.isArray(data)) {
        membersList = data;
      } else if (data.data && Array.isArray(data.data)) {
        membersList = data.data;
      } else {
        // Recherche d'un tableau d'utilisateurs dans la structure
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0].email) {
            membersList = data[key];
            break;
          }
        }
      }
      
      if (membersList && membersList.length > 0) {
        console.log(`${membersList.length} membres récupérés.`);
        setMembers(membersList);
        setLastSynced(new Date());
        
        // Sauvegarder en local
        localStorage.setItem('members_data', JSON.stringify(membersList));
        localStorage.setItem('members_last_synced', new Date().toISOString());
        
        toast({
          title: 'Membres chargés avec succès',
          description: `${membersList.length} membres récupérés.`
        });
      } else {
        throw new Error("Aucun membre trouvé dans la réponse");
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      
      // Essayer API alternative
      try {
        console.log("Tentative avec API alternative check-users.php");
        const apiUrl = getApiUrl();
        const altResponse = await fetch(`${apiUrl}/check-users.php`, {
          method: 'GET',
          headers: {'Accept': 'application/json'}
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (altData.records && Array.isArray(altData.records)) {
            console.log(`Récupération alternative réussie: ${altData.records.length} membres`);
            setMembers(altData.records);
            setLastSynced(new Date());
            return;
          }
        }
      } catch (altError) {
        console.error("Échec de la récupération alternative:", altError);
      }
      
      // Essayer de récupérer depuis le stockage local
      const storedMembers = localStorage.getItem('members_data');
      const storedLastSynced = localStorage.getItem('members_last_synced');
      
      if (storedMembers) {
        try {
          const parsedMembers = JSON.parse(storedMembers);
          setMembers(parsedMembers);
          
          if (storedLastSynced) {
            setLastSynced(new Date(storedLastSynced));
          }
          
          toast({
            title: 'Données locales chargées',
            description: 'Impossible de se connecter au serveur, utilisation des données locales.'
          });
        } catch (parseError) {
          console.error('Erreur lors du parsing des données locales:', parseError);
          toast({
            variant: 'destructive',
            title: 'Erreur de chargement',
            description: 'Impossible de charger les membres depuis le serveur ou les données locales.'
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur de chargement',
          description: 'Impossible de charger les membres depuis le serveur ou les données locales.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les membres au chargement de la page
  useEffect(() => {
    loadMembersFromServer();
  }, []);

  // Gestion de l'ajout d'un utilisateur
  const handleAddUserSuccess = () => {
    setIsAddDialogOpen(false);
    loadMembersFromServer();
    toast({
      title: "Utilisateur ajouté",
      description: "L'utilisateur a été ajouté avec succès."
    });
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Gestion des membres</CardTitle>
            <CardDescription>Administrez les utilisateurs et leurs rôles</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadMembersFromServer}
              disabled={isLoading}
              title="Rafraîchir les données"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            </Button>
            <Button 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Ajouter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-center text-gray-500">Chargement des membres...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                {lastSynced && (
                  <span>Dernière synchronisation: {lastSynced.toLocaleString()}</span>
                )}
              </div>
              
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{member.prenom} {member.nom}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button variant="ghost" size="sm">Modifier</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-center text-gray-500">Aucun membre trouvé. Cliquez sur "Ajouter" pour créer un membre.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue d'ajout d'utilisateur */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
          </DialogHeader>
          <AddUserForm onSuccess={handleAddUserSuccess} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
