
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Download, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import UserForm from '../UserForm';

interface UserManagementHeaderProps {
  isAdmin: boolean;
  hasManager: boolean;
  importingData: boolean;
  newUserOpen: boolean;
  onNewUserOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onImport: () => void;
  onSuccess: () => void;
  onUserConnect: (identifiant: string) => void;
  loading: boolean;
}

const UserManagementHeader = ({
  isAdmin,
  hasManager,
  importingData,
  newUserOpen,
  onNewUserOpenChange,
  onRefresh,
  onImport,
  onSuccess,
  onUserConnect,
  loading
}: UserManagementHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Gestion des utilisateurs</CardTitle>
        <CardDescription>Visualisez et gérez les utilisateurs du système</CardDescription>
      </div>
      <div className="flex gap-2">
        {isAdmin && hasManager && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onImport} 
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
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Actualiser</span>
        </Button>
        <Dialog open={newUserOpen} onOpenChange={onNewUserOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <UserForm 
            onClose={() => onNewUserOpenChange(false)}
            onSuccess={onSuccess}
            onUserConnect={onUserConnect}
          />
        </Dialog>
      </div>
    </CardHeader>
  );
};

export default UserManagementHeader;
