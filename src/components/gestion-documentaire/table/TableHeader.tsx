
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentTableHeaderProps {
  onAddDocument?: () => void;
}

const DocumentTableHeader: React.FC<DocumentTableHeaderProps> = ({ onAddDocument }) => {
  return (
    <TableHeader>
      <TableRow className="bg-app-light-blue">
        <TableHead className="text-app-blue font-medium text-sm w-10"></TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/4">Nom du document</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/12">R</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/12">A</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/12">C</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/12">I</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/6">État</TableHead>
        <TableHead className="text-app-blue font-medium text-sm w-1/6 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default DocumentTableHeader;
