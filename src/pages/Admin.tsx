
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, UserPlus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/admin/UserForm";
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserTable from '@/components/admin/UserTable';
import UserTables from '@/components/admin/UserTables';

// Définition des props pour Admin
interface AdminProps {
  currentDatabaseUser: string | null;
  onUserConnect: (identifiant: string) => void;
}

const Admin: React.FC<AdminProps> = ({ currentDatabaseUser, onUserConnect }) => {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const { utilisateurs, loading, error, loadUtilisateurs, handleConnectAsUser, deleteUser } = useAdminUsers();

  // Gérer l'action de connexion en tant qu'utilisateur
  const handleUserConnect = async (identifiantTechnique: string) => {
    const success = await handleConnectAsUser(identifiantTechnique);
    if (success && onUserConnect) {
      onUserConnect(identifiantTechnique);
    }
  };

  // Gérer l'action de suppression d'un utilisateur
  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    if (success) {
      // Recharger manuellement les utilisateurs pour s'assurer qu'ils sont à jour
      await loadUtilisateurs();
    }
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
          
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <UserForm 
              onClose={() => setFormOpen(false)} 
              onSuccess={() => loadUtilisateurs()}
              onUserConnect={handleUserConnect}
            />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="p-4 text-red-500">
                Erreur: {error}. 
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
