
import React, { useEffect } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, UserPlus, User, Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserManagement = () => {
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, retryCount } = useAdminUsers();
  const { toast } = useToast();

  useEffect(() => {
    loadUtilisateurs();
  }, [loadUtilisateurs]);

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
          
          <Button>
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
    </div>
  );
};

export default UserManagement;
