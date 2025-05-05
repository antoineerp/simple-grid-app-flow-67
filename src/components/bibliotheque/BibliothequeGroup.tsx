
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import BibliothequeList from './BibliothequeList';

export interface BibliothequeGroupProps {
  group: DocumentGroup;
  documents: Document[];
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
  onEditGroup?: (group: DocumentGroup) => void;
  onDeleteGroup?: (id: string) => void;
  onToggleGroup?: (id: string) => void;
}

const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({
  group,
  documents,
  onEditDocument,
  onDeleteDocument,
  onEditGroup,
  onDeleteGroup,
  onToggleGroup
}) => {
  const filteredDocuments = documents.filter(doc => doc.groupId === group.id);
  
  const handleToggle = () => {
    if (onToggleGroup) {
      onToggleGroup(group.id);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={handleToggle}>
            {group.expanded ? 
              <ChevronDown className="h-5 w-5 mr-2" /> : 
              <ChevronRight className="h-5 w-5 mr-2" />
            }
            <CardTitle className="text-lg">{group.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            {onEditGroup && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => onEditGroup(group)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDeleteGroup && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-destructive" 
                onClick={() => onDeleteGroup(group.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {group.expanded && (
        <CardContent className="pt-0">
          {filteredDocuments.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-md">
              <p className="text-gray-500">Aucun document dans ce groupe.</p>
            </div>
          ) : (
            <BibliothequeList
              documents={filteredDocuments}
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BibliothequeGroup;
