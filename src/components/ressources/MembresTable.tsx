
import React from 'react';
import { Membre } from '@/types/membres';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataTable, { Column } from '@/components/common/DataTable';

interface MembresTableProps {
  membres: Membre[];
  isLoading: boolean;
  onDelete?: (membre: any) => void;
}

export const MembresTable: React.FC<MembresTableProps> = ({ membres, isLoading, onDelete }) => {
  const handleEdit = (id: string) => {
    console.log('Edit membre:', id);
    // Logique d'édition à implémenter
  };

  const handleDelete = (id: string) => {
    console.log('Delete membre:', id);
    if (onDelete) {
      const membre = membres.find(m => m.id === id);
      if (membre) {
        onDelete(membre);
      }
    }
  };

  const columns: Column<Membre>[] = [
    {
      key: 'nom',
      header: 'Nom',
      cell: (membre) => membre.nom
    },
    {
      key: 'prenom',
      header: 'Prénom',
      cell: (membre) => membre.prenom
    },
    {
      key: 'email',
      header: 'Email',
      cell: (membre) => membre.email
    },
    {
      key: 'departement',
      header: 'Département',
      cell: (membre) => membre.departement || '-'
    },
    {
      key: 'fonction',
      header: 'Fonction',
      cell: (membre) => membre.fonction || '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (membre) => (
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(membre.id)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(membre.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CardContent className="p-0">
      <DataTable
        data={membres}
        columns={columns}
        isLoading={isLoading}
        emptyState={
          <div className="text-center p-8">
            <p className="text-muted-foreground">Aucun membre trouvé</p>
          </div>
        }
      />
    </CardContent>
  );
};
