
import React from 'react';
import { Membre } from '@/types/membres';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface MemberListProps {
  membres: Membre[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MemberList: React.FC<MemberListProps> = ({ membres, onEdit, onDelete }) => {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Fonction</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {membres.map((membre) => (
            <TableRow key={membre.id}>
              <TableCell>{membre.nom}</TableCell>
              <TableCell>{membre.prenom}</TableCell>
              <TableCell>{membre.email}</TableCell>
              <TableCell>{membre.departement || '-'}</TableCell>
              <TableCell>{membre.fonction || '-'}</TableCell>
              <TableCell className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(membre.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(membre.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MemberList;
