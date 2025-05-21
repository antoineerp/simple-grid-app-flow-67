
import React from 'react';
import { Plus } from 'lucide-react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface DocumentTableHeaderProps {
  onAddDocument: () => void;
}

const DocumentTableHeader: React.FC<DocumentTableHeaderProps> = ({ onAddDocument }) => {
  return (
    <TableHeader>
      <TableRow className="bg-app-light-blue">
        <TableHead className="w-10"></TableHead> {/* Gripable column */}
        <TableHead className="py-3 px-4 text-app-blue font-semibold">
          <div className="flex items-center justify-between">
            <span>Nom du document</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddDocument}
              className="h-8 px-2 hover:bg-app-blue/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-semibold">
          <div className="flex items-center justify-center text-center">
            <span>R.A.C.I</span>
          </div>
        </TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-semibold">
          <div className="flex items-center justify-center text-center">
            <span>État</span>
          </div>
        </TableHead>
        <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default DocumentTableHeader;
