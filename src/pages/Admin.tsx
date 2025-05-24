
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserTable from '@/components/admin/UserTable';
import UserTables from '@/components/admin/UserTables';
import CreateUserDialog from '@/components/admin/CreateUserDialog';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const Admin: React.FC<AdminProps> = ({ currentDatabaseUser, onUserConnect }) => {
  const { toast } = useToast();
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, deleteUser } = useAdminUsers();

  useEffect(() => {
    console.log("Admin: Chargement initial des utilisateurs depuis la base de données Infomaniak");
    loadUtilisateurs();
  }, [loadUtilisateurs]);

  const handleUserConnect = async (identifiantTechnique: string) => {
    const success = await handleConnectAsUser(identifiantTechnique);
    if (success && onUserConnect) {
      onUserConnect(identifiantTechnique);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      await loadUtilisateurs();
    }
  };

  const handleUserCreated = () => {
    console.log("Admin: Nouvel utilisateur créé, rechargement de la liste");
    loadUtilisateurs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administration</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadUtilisateurs()} 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Rafraîchir
          </Button>
          
          <CreateUserDialog onUserCreated={handleUserCreated} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur de connexion à la base de données Infomaniak: {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Utilisateurs de la base de données Infomaniak</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 text-red-500">
                Erreur de connexion à la base de données Infomaniak: {error}. 
                <Button 
                  variant="link" 
                  onClick={loadUtilisateurs}
                  className="h-auto p-0 pl-2"
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <UserTable 
                  users={utilisateurs}
                  loading={loading}
                  currentUser={currentDatabaseUser || ''}
                  onConnect={handleUserConnect}
                  onDelete={handleDeleteUser}
                />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {currentDatabaseUser && (
          <Card className="md:col-span-2">
            <UserTables userId={currentDatabaseUser} />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
