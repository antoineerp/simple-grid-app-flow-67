
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, RefreshCw, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import UserForm from './UserForm';
import { getCurrentUser, getLastConnectionError } from '@/services';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Utilisateur } from '@/services';

interface UserManagementProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const UserManagement = ({ currentDatabaseUser, onUserConnect }: UserManagementProps) => {
  const { toast } = useToast();
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser } = useAdminUsers();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier s'il y a une erreur de connexion au chargement
    const lastError = getLastConnectionError();
    if (lastError) {
      setConnectionError(lastError);
    }
  }, [currentDatabaseUser]);

  const handleSuccessfulUserCreation = () => {
    loadUtilisateurs();
    setConnectionError(null);
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const connectUser = async (identifiantTechnique: string) => {
    setConnectionError(null);
    const success = await handleConnectAsUser(identifiantTechnique);
    if (success) {
      onUserConnect(identifiantTechnique);
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
        {connectionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur de connexion: {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Table>
          <TableCaption>Liste des utilisateurs enregistrés dans le système</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Identifiant technique</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilisateurs.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              utilisateurs.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.nom, user.prenom)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.prenom} {user.nom}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.identifiant_technique}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.date_creation}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => connectUser(user.identifiant_technique)}
                      disabled={currentDatabaseUser === user.identifiant_technique}
                    >
                      <LogIn className="h-4 w-4 mr-1" />
                      {currentDatabaseUser === user.identifiant_technique ? 'Connecté' : 'Connecter'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
