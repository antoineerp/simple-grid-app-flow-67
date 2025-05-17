
import React from 'react';
import { Membre } from '@/types/membres';
import MemberList from '@/components/ressources-humaines/MemberList';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      {membres.length > 0 ? (
        <MemberList 
          membres={membres} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      ) : (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Aucun membre trouvé</p>
        </div>
      )}
    </CardContent>
  );
};
