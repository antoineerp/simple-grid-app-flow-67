
import React from 'react';
import { DocumentGroup, Document } from '@/types/bibliotheque';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import BibliothequeList from './BibliothequeList';

interface BibliothequeGroupProps {
  group: DocumentGroup;
  onEditGroup?: (group: DocumentGroup) => void;
  onDeleteGroup?: (id: string) => void;
  onEdit?: (group: DocumentGroup) => void; // For backward compatibility
  onDelete?: (id: string) => void; // For backward compatibility
  documents?: Document[];
  onEditDocument?: (document: Document) => void;
  onDeleteDocument?: (id: string) => void;
}

const BibliothequeGroup: React.FC<BibliothequeGroupProps> = ({
  group,
  onEditGroup,
  onDeleteGroup,
  onEdit,
  onDelete,
  documents,
  onEditDocument,
  onDeleteDocument
}) => {
  const [expanded, setExpanded] = React.useState(group.expanded);

  const handleEdit = () => {
    if (onEditGroup) {
      onEditGroup(group);
    } else if (onEdit) {
      onEdit(group);
    }
  };

  const handleDelete = () => {
    if (onDeleteGroup) {
      onDeleteGroup(group.id);
    } else if (onDelete) {
      onDelete(group.id);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Filter documents that belong to this group
  const groupDocuments = documents?.filter(doc => doc.groupId === group.id) || group.items || [];

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={toggleExpanded}>
            {expanded ? <ChevronDown className="h-5 w-5 mr-1" /> : <ChevronRight className="h-5 w-5 mr-1" />}
            <h3 className="font-medium">{group.name}</h3>
          </div>
          <div className="flex space-x-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-destructive" 
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-4">
          {groupDocuments.length > 0 ? (
            <BibliothequeList 
              documents={groupDocuments} 
              onEditDocument={onEditDocument}
              onDeleteDocument={onDeleteDocument}
              onEdit={onEditDocument} // Pass through for backward compatibility
              onDelete={onDeleteDocument} // Pass through for backward compatibility
            />
          ) : (
            <div className="text-center p-4 border border-dashed rounded-md">
              <p className="text-gray-500">Aucun document dans ce groupe.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BibliothequeGroup;
