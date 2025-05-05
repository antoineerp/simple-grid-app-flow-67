
import React from 'react';
import { Document } from '@/types/bibliotheque';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

interface BibliothequeListProps {
  documents: Document[];
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
  onEdit?: (document: Document) => void; // Added for backward compatibility
  onDelete?: (id: string) => void; // Added for backward compatibility
}

const BibliothequeList: React.FC<BibliothequeListProps> = ({
  documents,
  onEditDocument,
  onDeleteDocument,
  onEdit,
  onDelete
}) => {
  // Use either the new or old prop names
  const handleEdit = (doc: Document) => {
    if (onEdit) {
      onEdit(doc);
    } else {
      onEditDocument(doc);
    }
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    } else {
      onDeleteDocument(id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-md">
        <p className="text-gray-500">Aucun document trouvé.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <Card key={document.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-medium truncate">{document.name}</h3>
              <div className="flex space-x-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => handleEdit(document)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive" 
                  onClick={() => handleDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {document.link && (
              <a 
                href={document.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-sm text-blue-600 hover:underline truncate block"
              >
                {document.link}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BibliothequeList;
