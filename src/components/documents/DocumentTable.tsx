
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentTableProps {
  currentUser: string;
}

const DocumentTable: React.FC<DocumentTableProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const { 
    documents, 
    groups,
    handleSyncDocuments,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  } = useBibliotheque();
  
  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Documents</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/collaboration')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Gérer les documents
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Lien</TableHead>
            <TableHead>Groupe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                Aucun document disponible. Veuillez ajouter des documents depuis la page Collaboration.
              </TableCell>
            </TableRow>
          ) : (
            documents
              .filter(doc => doc.userId === currentUser || !doc.userId)
              .map(doc => {
                // Find group name if the document belongs to a group
                const groupName = doc.groupId ? 
                  groups.find(g => g.id === doc.groupId)?.name || 'Groupe inconnu' 
                  : '-';
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>
                      {doc.link ? (
                        <a
                          href={doc.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {doc.link}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{groupName}</TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
