
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DocumentTableHeader = () => {
  return (
    <TableHeader>
      <TableRow className="bg-app-light-blue">
        <TableHead className="w-10"></TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm w-1/3">Nom</TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm">Fichier</TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm text-center" colSpan={4}>
          Responsabilités
        </TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm">Exclusion</TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm text-center" colSpan={3}>
          Atteinte
        </TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-medium text-sm text-right">Actions</TableHead>
      </TableRow>
      <TableRow className="bg-app-light-blue">
        <TableHead></TableHead>
        <TableHead></TableHead>
        <TableHead></TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium">R</TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium">A</TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium">C</TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium">I</TableHead>
        <TableHead></TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium text-red-500">NC</TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium text-yellow-500">PC</TableHead>
        <TableHead className="py-2 px-2 text-center text-sm font-medium text-green-500">C</TableHead>
        <TableHead></TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default DocumentTableHeader;
