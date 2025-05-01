
import React from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import BibliothequeList from './BibliothequeList';

interface BibliothequeGroupProps {
  group: DocumentGroup;
  onEdit?: (group: DocumentGroup) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  documents?: Document[];
  onEditDocument?: (document: Document) => void;
  onDeleteDocument?: (id: string) => void;
  onEditGroup?: (group: DocumentGroup) => void;
  onDeleteGroup?: (id: string) => void;
}

const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({
  group,
  onEdit,
  onDelete,
  onToggle,
  documents,
  onEditDocument,
  onDeleteDocument,
  onEditGroup,
  onDeleteGroup
}) => {
  // Utiliser les nouvelles props si disponibles, sinon utiliser les anciennes
  const handleEditGroup = onEditGroup || onEdit;
  const handleDeleteGroup = onDeleteGroup || onDelete;

  const toggleGroup = () => {
    if (onToggle) {
      onToggle(group.id);
    }
  };

  // Filtrer les documents qui appartiennent à ce groupe
  const groupDocuments = documents?.filter(doc => doc.groupId === group.id) || group.items || [];

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex items-center cursor-pointer" onClick={toggleGroup}>
          {group.expanded ? (
            <ChevronDown className="h-4 w-4 mr-2" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2" />
          )}
          <h3 className="font-medium">{group.name}</h3>
        </div>
        
        <div className="flex space-x-1">
          {handleEditGroup && (
            <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {handleDeleteGroup && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500" 
              onClick={() => handleDeleteGroup(group.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {group.expanded && (
        <CardContent className="p-4">
          {groupDocuments.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun document dans ce groupe</p>
          ) : (
            <BibliothequeList 
              documents={groupDocuments} 
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
