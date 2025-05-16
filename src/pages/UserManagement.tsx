
import React, { useEffect, useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, UserPlus, User, Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { initializeUserTables } from '@/services/core/userInitializationService';

const UserManagement = () => {
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, retryCount } = useAdminUsers();
  const { toast } = useToast();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  useEffect(() => {
    loadUtilisateurs();
  }, [loadUtilisateurs]);

  const handleUserCreated = () => {
    toast({
      title: "Utilisateur créé",
      description: "L'utilisateur a été créé avec succès et ses tables ont été initialisées."
    });
    loadUtilisateurs(); // Recharger la liste après création
  };

  const handleInitializeUserTables = async (userId: string) => {
    try {
      toast({
        title: "Initialisation en cours",
        description: "Préparation des données pour cet utilisateur..."
      });

      const success = await initializeUserTables(userId);
      
      if (success) {
        toast({
          title: "Initialisation réussie",
          description: "Les tables de l'utilisateur ont été créées avec succès."
        });
      } else {
        toast({
          title: "Initialisation partielle",
          description: "Certaines tables n'ont pas pu être créées. L'utilisateur peut rencontrer des problèmes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des tables:", error);
      toast({
        title: "Échec de l'initialisation",
        description: "Une erreur est survenue lors de la création des tables utilisateur.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => loadUtilisateurs()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button onClick={() => setIsCreateUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> 
            Liste des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-sm">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs mt-2">Tentatives de reconnexion: {retryCount}/3</p>
              )}
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilisateurs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  utilisateurs.map((user) => (
                    <TableRow key={user.id || user.identifiant_technique}>
                      <TableCell>
                        {user.prenom} {user.nom}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Shield className={`h-4 w-4 ${
                            user.role === 'administrateur' ? 'text-blue-600' : 
                            user.role === 'gestionnaire' ? 'text-green-600' : 'text-gray-600'
                          }`} />
                          <span className="capitalize">{user.role || 'utilisateur'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConnectAsUser(user.identifiant_technique)}
                          >
                            Se connecter en tant que
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleInitializeUserTables(user.identifiant_technique)}
                            title="Initialiser les tables"
                          >
                            Initialiser les tables
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Détails"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog 
        open={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        onUserCreated={handleUserCreated}
        onUserConnect={handleConnectAsUser}
      />
    </div>
  );
};

export default UserManagement;
