
import React, { useEffect, useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, UserPlus, User, Shield, Info, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { initializeUserTables, checkUserTablesInitialized } from '@/services/core/userInitializationService';

const UserManagement = () => {
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, retryCount } = useAdminUsers();
  const { toast } = useToast();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [tableInitStatus, setTableInitStatus] = useState<Record<string, boolean | null>>({});
  const [checkingTables, setCheckingTables] = useState(false);

  useEffect(() => {
    loadUtilisateurs();
  }, [loadUtilisateurs]);

  // Vérifier les tables utilisateur
  useEffect(() => {
    const checkTables = async () => {
      if (utilisateurs.length > 0 && !checkingTables) {
        setCheckingTables(true);
        
        const statuses: Record<string, boolean | null> = {};
        
        for (const user of utilisateurs) {
          try {
            if (user.identifiant_technique) {
              const status = await checkUserTablesInitialized(user.identifiant_technique);
              statuses[user.identifiant_technique] = status;
            }
          } catch (error) {
            console.error(`Erreur lors de la vérification des tables pour ${user.identifiant_technique}:`, error);
            statuses[user.identifiant_technique || ''] = null;
          }
        }
        
        setTableInitStatus(statuses);
        setCheckingTables(false);
      }
    };
    
    checkTables();
  }, [utilisateurs]);

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
        description: "Préparation des données isolées pour cet utilisateur..."
      });

      const success = await initializeUserTables(userId);
      
      if (success) {
        // Mise à jour du statut local
        setTableInitStatus(prev => ({
          ...prev,
          [userId]: true
        }));
        
        toast({
          title: "Initialisation réussie",
          description: "Les tables isolées de l'utilisateur ont été créées avec succès."
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
          <CardDescription>
            Chaque utilisateur dispose de ses propres données isolées
          </CardDescription>
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
                  <TableHead>Tables initialisées</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilisateurs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
                        {user.identifiant_technique && (
                          <div className="flex items-center">
                            {tableInitStatus[user.identifiant_technique] === true && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Initialisées
                              </Badge>
                            )}
                            {tableInitStatus[user.identifiant_technique] === false && (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                Non initialisées
                              </Badge>
                            )}
                            {tableInitStatus[user.identifiant_technique] === null && (
                              <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                Statut inconnu
                              </Badge>
                            )}
                            {tableInitStatus[user.identifiant_technique] === undefined && (
                              <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => user.identifiant_technique && handleConnectAsUser(user.identifiant_technique)}
                          >
                            Se connecter en tant que
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => user.identifiant_technique && handleInitializeUserTables(user.identifiant_technique)}
                            title="Initialiser les tables"
                          >
                            <Database className="h-4 w-4" />
                            Initialiser
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

// Ajout du composant Badge manquant
const Badge = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <span className={`px-2 py-1 rounded text-xs font-medium ${className || ''}`}>
    {children}
  </span>
);

export default UserManagement;
