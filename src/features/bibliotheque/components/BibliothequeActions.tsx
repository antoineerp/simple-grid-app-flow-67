
import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus, FilePlus } from 'lucide-react';

interface BibliothequeActionsProps {
  onAddGroup: () => void;
  onAddDocument: () => void;
}

export const BibliothequeActions: React.FC<BibliothequeActionsProps> = ({
  onAddGroup,
  onAddDocument
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddGroup}
        className="flex items-center"
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        Nouveau Groupe
      </Button>
      
      <Button 
        variant="default" 
        size="sm"
        onClick={onAddDocument} 
        className="flex items-center"
      >
        <FilePlus className="mr-2 h-4 w-4" />
        Nouveau Document
      </Button>
    </div>
  );
};
