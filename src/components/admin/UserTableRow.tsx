
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { Utilisateur } from '@/services';

interface UserTableRowProps {
  user: Utilisateur;
  currentDatabaseUser: string | null;
  showPassword: boolean;
  getInitials: (nom: string, prenom: string) => string;
  onTogglePassword: (userId: number) => void;
  onConnect: (identifiant: string) => void;
}

export const UserTableRow = ({
  user,
  currentDatabaseUser,
  showPassword,
  getInitials,
  onTogglePassword,
  onConnect
}: UserTableRowProps) => {
  return (
    <TableRow>
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
            {showPassword ? user.mot_de_passe : '••••••'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePassword(user.id)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
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
          onClick={() => onConnect(user.identifiant_technique)}
          disabled={currentDatabaseUser === user.identifiant_technique}
        >
          <LogIn className="h-4 w-4 mr-1" />
          {currentDatabaseUser === user.identifiant_technique ? 'Connecté' : 'Connecter'}
        </Button>
      </TableCell>
    </TableRow>
  );
};
