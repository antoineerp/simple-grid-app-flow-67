
import React from 'react';
import { Document } from '@/types/bibliotheque';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

interface BibliothequeListProps {
  documents: Document[];
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (id: string) => void;
}

const BibliothequeList: React.FC<BibliothequeListProps> = ({
  documents,
  onEditDocument,
  onDeleteDocument
}) => {
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
                <Button variant="ghost" size="sm" onClick={() => onEditDocument(document)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500" 
                  onClick={() => onDeleteDocument(document.id)}
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
                className="text-sm text-blue-500 hover:underline mt-2 block truncate"
              >
                {document.link}
              </a>
            )}
            
            {!document.link && (
              <p className="text-sm text-gray-500 mt-2">Aucun lien disponible</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BibliothequeList;
