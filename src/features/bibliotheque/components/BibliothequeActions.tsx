
import React from 'react';
import { Button } from "@/components/ui/button";
import { FolderPlus } from 'lucide-react';

interface BibliothequeActionsProps {
  onAddGroup: () => void;
  onAddDocument: () => void;
}

export const BibliothequeActions: React.FC<BibliothequeActionsProps> = ({
  onAddGroup,
  onAddDocument
}) => {
  return (
    <div className="flex justify-end mt-4 space-x-2">
      <Button 
        variant="outline"
        className="hover:bg-gray-100 transition-colors"
        onClick={onAddGroup}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        Nouveau groupe
      </Button>
      <Button 
        variant="default"
        onClick={onAddDocument}
      >
        Nouveau document
      </Button>
    </div>
  );
};
