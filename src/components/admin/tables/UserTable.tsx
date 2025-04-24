
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogIn, Eye, EyeOff } from 'lucide-react';
import type { Utilisateur } from '@/services';

interface UserTableProps {
  users: Utilisateur[];
  currentDatabaseUser: string | null;
  showPasswords: {[key: string]: boolean};
  onTogglePassword: (userId: number) => void;
  onConnectUser: (identifiantTechnique: string) => void;
}

const UserTable = ({ 
  users, 
  currentDatabaseUser, 
  showPasswords, 
  onTogglePassword, 
  onConnectUser 
}: UserTableProps) => {
  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  return (
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
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              Aucun utilisateur trouvé dans la base de données.
            </TableCell>
          </TableRow>
        ) : (
          users.map(user => (
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
                    onClick={() => onTogglePassword(user.id)}
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
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'gestionnaire' ? 'destructive' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.date_creation}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onConnectUser(user.identifiant_technique)}
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
  );
};

export default UserTable;
