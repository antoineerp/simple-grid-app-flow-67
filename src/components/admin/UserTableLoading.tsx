
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface UserTableLoadingProps {
  loadUtilisateurs: () => void;
}

export const UserTableLoading = ({ loadUtilisateurs }: UserTableLoadingProps) => (
  <div className="flex flex-col items-center justify-center py-10">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground">Chargement des utilisateurs...</p>
  </div>
);

export const EmptyUserTable = ({ loadUtilisateurs }: UserTableLoadingProps) => (
  <tr>
    <td colSpan={7} className="text-center text-muted-foreground py-8">
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
    </td>
  </tr>
);
