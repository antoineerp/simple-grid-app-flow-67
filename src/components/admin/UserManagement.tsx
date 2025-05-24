
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, 
  RefreshCw, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  Database, 
  Info, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import UserForm from './UserForm';
import { getCurrentUser, getLastConnectionError, getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { adminImportFromManager } from '@/services/core/userInitializationService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { clearUsersCache } from '@/services/users/userService';
import UserTables from './UserTables';
import { syncAllUserTables } from '@/utils/userTableVerification';
import type { Utilisateur } from '@/types/auth';

interface UserManagementProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const UserManagement = ({ currentDatabaseUser, onUserConnect }: UserManagementProps) => {
  const { toast } = useToast();
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, deleteUser, verifyAllUserTables } = useAdminUsers();
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [importingData, setImportingData] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [connectingUser, setConnectingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [forceRefreshing, setForceRefreshing] = useState(false);
  const [verifyingTables, setVerifyingTables] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    inProgress: boolean;
    success: boolean | null;
    message: string | null;
  }>({
    inProgress: false,
    success: null,
    message: null
  });

  useEffect(() => {
    // Recharger les données au montage
    loadUtilisateurs();
    
    // Vérifier s'il y a une erreur de connexion
    const lastError = getLastConnectionError();
    if (lastError) {
      setConnectionError(lastError);
    }
    
    // Écouter les changements d'utilisateur
    const handleUserChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newUser = customEvent.detail?.user;
      if (newUser) {
        onUserConnect(newUser);
        setConnectionError(null);
      }
    };
    
    window.addEventListener('database-user-changed', handleUserChange);
    
    return () => {
      window.removeEventListener('database-user-changed', handleUserChange);
    };
  }, [onUserConnect, loadUtilisateurs]);

  const handleSuccessfulUserCreation = () => {
    clearUsersCache();
    loadUtilisateurs();
    setConnectionError(null);
  };

  const getInitials = (nom: string, prenom: string): string => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const togglePasswordVisibility = (userId: string | number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId.toString()]: !prev[userId.toString()]
    }));
  };

  const connectUser = async (identifiantTechnique: string): Promise<boolean> => {
    setConnectionError(null);
    setConnectingUser(identifiantTechnique);
    
    try {
      const success = await handleConnectAsUser(identifiantTechnique);
      
      if (success) {
        onUserConnect(identifiantTechnique);
        toast({
          title: "Connexion réussie",
          description: `Connecté en tant que ${identifiantTechnique}`,
        });
        
        // Redirection pour forcer un rechargement complet
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        return true;
      } else {
        const error = getLastConnectionError();
        setConnectionError(error || "Erreur inconnue lors de la connexion");
        toast({
          title: "Erreur de connexion",
          description: error || "Erreur inconnue lors de la connexion",
          variant: "destructive",
        });
        
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setConnectionError(errorMessage);
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setConnectingUser(null);
    }
  };
  
  const handleForceRefresh = async () => {
    setForceRefreshing(true);
    try {
      // Effacer le cache local
      clearUsersCache();
      
      // Forcer un rechargement depuis l'API
      await loadUtilisateurs();
      
      toast({
        title: "Données actualisées",
        description: "La liste des utilisateurs a été rechargée depuis la base de données.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'actualisation",
        description: error instanceof Error ? error.message : "Erreur lors de l'actualisation des données",
        variant: "destructive",
      });
    } finally {
      setForceRefreshing(false);
    }
  };
  
  const handleVerifyAllTables = async () => {
    setVerifyingTables(true);
    setVerificationStatus({
      inProgress: true,
      success: null,
      message: "Vérification des tables en cours..."
    });
    
    try {
      const result = await syncAllUserTables();
      
      setVerificationStatus({
        inProgress: false,
        success: result.success,
        message: `Vérification terminée pour ${result.results.length} utilisateurs.`
      });
      
      toast({
        title: result.success ? "Vérification réussie" : "Vérification terminée",
        description: `${result.results.length} utilisateurs traités.`,
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (error) {
      setVerificationStatus({
        inProgress: false,
        success: false,
        message: error instanceof Error ? error.message : "Erreur lors de la vérification des tables."
      });
      
      toast({
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la vérification des tables.",
        variant: "destructive"
      });
    } finally {
      setVerifyingTables(false);
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
        description: error instanceof Error ? error.message : "Erreur inconnue lors de l'import",
        variant: "destructive",
      });
    } finally {
      setImportingData(false);
    }
  };
  
  const showUserTables = (identifiantTechnique: string) => {
    setSelectedUser(identifiantTechnique);
  };

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId);
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUserId) return;
    
    try {
      const success = await deleteUser(deletingUserId);
      
      if (success) {
        toast({
          title: "Utilisateur supprimé",
          description: "L'utilisateur a été supprimé avec succès.",
          variant: "default"
        });
        
        // Recharger la liste des utilisateurs
        await loadUtilisateurs();
      } else {
        toast({
          title: "Erreur de suppression",
          description: "Impossible de supprimer cet utilisateur.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de suppression",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setConfirmDeleteOpen(false);
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h2>
        <div className="flex gap-2">
          <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <UserForm onSuccess={handleSuccessfulUserCreation} onClose={() => setNewUserOpen(false)} />
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleForceRefresh} 
            disabled={loading || forceRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || forceRefreshing) ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            onClick={handleVerifyAllTables}
            disabled={verifyingTables}
          >
            {verifyingTables ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Vérifier toutes les tables
          </Button>
        </div>
      </div>

      {connectionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{connectionError}</AlertDescription>
        </Alert>
      )}
      
      {verificationStatus.message && (
        <Alert variant={verificationStatus.success ? "default" : "destructive"} className="mb-4">
          {verificationStatus.inProgress ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : verificationStatus.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{verificationStatus.message}</AlertDescription>
        </Alert>
      )}

      {!loading && utilisateurs.length > 0 && (
        <Alert variant="default" className="bg-muted">
          <Info className="h-4 w-4" />
          <AlertTitle>Informations sur la connexion</AlertTitle>
          <AlertDescription>
            <p>Les données affichées proviennent directement de la base de données.</p>
            <p className="text-xs mt-1">{utilisateurs.length} utilisateurs trouvés dans la table <code>utilisateurs</code>.</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {utilisateurs.length} utilisateurs trouvés dans la base de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || forceRefreshing ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3">{forceRefreshing ? "Actualisation des données..." : "Chargement..."}</p>
              </div>
            ) : utilisateurs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '60px' }}></TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Identifiant technique</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilisateurs.map((user) => (
                      <TableRow key={user.id} className={currentDatabaseUser === user.identifiant_technique ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(user.nom, user.prenom)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.prenom} {user.nom}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {user.identifiant_technique}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => showUserTables(user.identifiant_technique)}
                            >
                              <Database className="h-4 w-4" />
                              <span className="sr-only">Tables</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => connectUser(user.identifiant_technique)}
                              disabled={connectingUser === user.identifiant_technique || currentDatabaseUser === user.identifiant_technique}
                            >
                              {connectingUser === user.identifiant_technique ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <LogIn className="h-4 w-4" />
                              )}
                              <span className="sr-only">Se connecter</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.id.toString())}
                              disabled={currentDatabaseUser === user.identifiant_technique}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
                <p className="font-medium text-destructive">Erreur lors du chargement des utilisateurs</p>
                <p className="mt-1">{error}</p>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="col-span-3">
          {selectedUser && <UserTables userId={selectedUser} />}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
              <br /><br />
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Attention</AlertTitle>
                <AlertDescription>
                  La suppression supprimera également toutes les tables associées à cet utilisateur.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
