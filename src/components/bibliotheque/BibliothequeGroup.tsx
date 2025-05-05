
import React, { useState } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import BibliothequeList from './BibliothequeList';

interface BibliothequeGroupProps {
  group: DocumentGroup;
  onEdit: (group: DocumentGroup) => void;
  onDelete: (id: string) => void;
  documents?: Document[];
  onEditDocument?: (document: Document) => void;
  onDeleteDocument?: (id: string) => void;
}

const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({
  group,
  onEdit,
  onDelete,
  documents = [],
  onEditDocument,
  onDeleteDocument
}) => {
  const [expanded, setExpanded] = useState(group.expanded);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={toggleExpanded}>
            {expanded ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            <CardTitle className="text-lg">{group.name}</CardTitle>
          </div>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500" 
              onClick={() => onDelete(group.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4">
          {onEditDocument && onDeleteDocument ? (
            <BibliothequeList
              documents={documents}
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
            />
          ) : (
            <div className="text-center p-4 text-gray-500">
              Aucun document dans ce groupe
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BibliothequeGroup;
