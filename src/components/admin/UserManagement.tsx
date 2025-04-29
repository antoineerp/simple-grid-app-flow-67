
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, RefreshCw, UserPlus, LogIn, AlertCircle, Eye, EyeOff, Download, Trash } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import UserForm from './UserForm';
import { getCurrentUser, getLastConnectionError } from '@/services/core/databaseConnectionService';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminImportFromManager } from '@/services/core/userInitializationService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
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
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [importingData, setImportingData] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const connectUser = async (identifiantTechnique: string) => {
    setConnectionError(null);
    const success = await handleConnectAsUser(identifiantTechnique);
    if (success) {
      onUserConnect(identifiantTechnique);
      window.location.reload(); // Recharger la page dans la même fenêtre
    } else {
      const error = getLastConnectionError();
      setConnectionError(error || "Erreur inconnue lors de la connexion");
    }
  };
  
  const importManagerData = async () => {
    setImportingData(true);
    try {
      const success = await adminImportFromManager();
      if (success) {
        toast({
          title: "Import réussi",
          description: "Les données du gestionnaire ont été importées avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer les données du gestionnaire",
        variant: "destructive",
      });
    } finally {
      setImportingData(false);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }
    
    setDeletingUserId(userId);
    
    try {
      const response = await fetch(`${getApiUrl()}/users`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Succès",
          description: "L'utilisateur a été supprimé avec succès",
        });
        loadUtilisateurs();  // Recharger la liste des utilisateurs
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la suppression de l'utilisateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const isCurrentUserAdmin = () => {
    if (!currentDatabaseUser || !utilisateurs.length) return false;
    const currentUser = utilisateurs.find(user => user.identifiant_technique === currentDatabaseUser);
    return currentUser?.role === 'administrateur';
  };
  
  const hasManager = utilisateurs.some(user => user.role === 'gestionnaire');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestion des utilisateurs</CardTitle>
          <CardDescription>Visualisez et gérez les utilisateurs du système</CardDescription>
        </div>
        <div className="flex gap-2">
          {isCurrentUserAdmin() && hasManager && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={importManagerData} 
              disabled={importingData}
            >
              {importingData ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Importer données gestionnaire
            </Button>
          )}
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement des utilisateurs...</p>
          </div>
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
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun utilisateur trouvé dans la base de données.
                    <br />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadUtilisateurs} 
                      className="mt-4"
                    >
                      Réessayer
                    </Button>
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPasswords[user.id] ? user.mot_de_passe : '••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'administrateur' ? 'default' : user.role === 'gestionnaire' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.date_creation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => connectUser(user.identifiant_technique)}
                          disabled={currentDatabaseUser === user.identifiant_technique}
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          {currentDatabaseUser === user.identifiant_technique ? 'Connecté' : 'Connecter'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={currentDatabaseUser === user.identifiant_technique || deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
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
  );
};

export default UserManagement;
