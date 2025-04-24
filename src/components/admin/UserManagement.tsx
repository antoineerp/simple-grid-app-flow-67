
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { getLastConnectionError } from '@/services/core/databaseConnectionService';
import { useToast } from "@/hooks/use-toast";
import { adminImportFromManager } from '@/services/core/userInitializationService';
import UserTable from './tables/UserTable';
import UserManagementHeader from './header/UserManagementHeader';
import UserManagementErrors from './errors/UserManagementErrors';

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

  const togglePasswordVisibility = (userId: number) => {
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
      window.location.reload();
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
  
  const isCurrentUserAdmin = () => {
    if (!currentDatabaseUser || !utilisateurs.length) return false;
    const currentUser = utilisateurs.find(user => user.identifiant_technique === currentDatabaseUser);
    return currentUser?.role === 'admin';
  };
  
  const hasManager = utilisateurs.some(user => user.role === 'gestionnaire');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <Card>
      <UserManagementHeader
        isAdmin={isCurrentUserAdmin()}
        hasManager={hasManager}
        importingData={importingData}
        newUserOpen={newUserOpen}
        onNewUserOpenChange={setNewUserOpen}
        onRefresh={loadUtilisateurs}
        onImport={importManagerData}
        onSuccess={handleSuccessfulUserCreation}
        onUserConnect={onUserConnect}
        loading={loading}
      />
      <CardContent>
        <UserManagementErrors 
          connectionError={connectionError}
          error={error}
        />
        <UserTable
          users={utilisateurs}
          currentDatabaseUser={currentDatabaseUser}
          showPasswords={showPasswords}
          onTogglePassword={togglePasswordVisibility}
          onConnectUser={connectUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserManagement;
