
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useUserTable } from '@/hooks/useUserTable';
import { getCurrentUser, getLastConnectionError } from '@/services';
import UserForm from './UserForm';
import { UserError } from './UserError';
import { UserTableLoading, EmptyUserTable } from './UserTableLoading';
import { UserTableRow } from './UserTableRow';

interface UserManagementProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const UserManagement = ({ currentDatabaseUser, onUserConnect }: UserManagementProps) => {
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser } = useAdminUsers();
  const { showPasswords, getInitials, togglePasswordVisibility } = useUserTable();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const lastError = getLastConnectionError();
    if (lastError) {
      setConnectionError(lastError);
    }
  }, [currentDatabaseUser]);

  const handleSuccessfulUserCreation = () => {
    loadUtilisateurs();
    setConnectionError(null);
  };

  const connectUser = async (identifiantTechnique: string) => {
    setConnectionError(null);
    const success = await handleConnectAsUser(identifiantTechnique);
    if (success) {
      onUserConnect(identifiantTechnique);
      window.location.reload();
    } else {
      const error = getLastConnectionError();
      setConnectionError(error || "Erreur inconnue lors de la connexion");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestion des utilisateurs</CardTitle>
          <CardDescription>Visualisez et gérez les utilisateurs du système</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUtilisateurs} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Actualiser</span>
          </Button>
          <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <UserForm 
              onClose={() => setNewUserOpen(false)}
              onSuccess={handleSuccessfulUserCreation}
              onUserConnect={onUserConnect}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <UserError error={error} connectionError={connectionError} />

        {loading ? (
          <UserTableLoading loadUtilisateurs={loadUtilisateurs} />
        ) : (
          <Table>
            <TableCaption>Liste des utilisateurs enregistrés dans le système</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Identifiant technique</TableHead>
                <TableHead>Mot de passe</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {utilisateurs.length === 0 ? (
                <EmptyUserTable loadUtilisateurs={loadUtilisateurs} />
              ) : (
                utilisateurs.map(user => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    currentDatabaseUser={currentDatabaseUser}
                    showPassword={showPasswords[user.id]}
                    getInitials={getInitials}
                    onTogglePassword={togglePasswordVisibility}
                    onConnect={connectUser}
                  />
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
