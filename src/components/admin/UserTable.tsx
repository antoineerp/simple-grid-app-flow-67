
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Utilisateur } from '@/types/auth';

interface UserTableProps {
  users: Utilisateur[];
  loading: boolean;
  currentUser: string;
  onConnect: (identifiant: string) => void;
  onDelete: (id: string) => Promise<void>;
}

const UserTable: React.FC<UserTableProps> = ({ users, loading, currentUser, onConnect, onDelete }) => {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun utilisateur trouvé
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Identifiant</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={user.identifiant_technique === currentUser ? "bg-muted/50" : ""}>
            <TableCell className="font-medium">
              {user.prenom} {user.nom}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.identifiant_technique}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'default' : user.role === 'gestionnaire' ? 'secondary' : 'outline'}>
                {user.role === 'admin' 
                  ? 'Administrateur' 
                  : user.role === 'gestionnaire' 
                    ? 'Gestionnaire' 
                    : 'Utilisateur'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={user.identifiant_technique === currentUser}
                  onClick={() => onConnect(user.identifiant_technique)}
                >
                  <UserCheck className="h-4 w-4" />
                  <span className="sr-only">Se connecter en tant que</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={user.identifiant_technique === currentUser}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Vous êtes sur le point de supprimer l'utilisateur {user.prenom} {user.nom} ({user.identifiant_technique}). Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(user.id.toString())}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
