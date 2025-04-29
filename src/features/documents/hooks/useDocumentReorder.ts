
import { useCallback } from 'react';
import { Document } from '@/types/documents';

interface UseDocumentReorderProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  groups: any[];
  setGroups: React.Dispatch<React.SetStateAction<any[]>>;
  handleSyncWithServer: () => Promise<boolean>;
}

export const useDocumentReorder = ({
  documents,
  setDocuments,
  groups,
  setGroups,
  handleSyncWithServer
}: UseDocumentReorderProps) => {

  const handleReorder = useCallback((startIndex: number, endIndex: number, targetGroupId?: string) => {
    console.log('Réorganisation des documents:', startIndex, endIndex, targetGroupId);
    const newDocuments = [...documents];
    const [removed] = newDocuments.splice(startIndex, 1);
    const updated = { ...removed, groupId: targetGroupId };
    newDocuments.splice(endIndex, 0, updated);
    setDocuments(newDocuments);
    
    // Synchroniser après réorganisation
    handleSyncWithServer().catch(err => console.error("Erreur lors de la synchronisation après réorganisation:", err));
  }, [documents, setDocuments, handleSyncWithServer]);
  
  const handleGroupReorder = useCallback((startIndex: number, endIndex: number) => {
    console.log('Réorganisation des groupes:', startIndex, endIndex);
    const newGroups = [...groups];
    const [removed] = newGroups.splice(startIndex, 1);
    newGroups.splice(endIndex, 0, removed);
    setGroups(newGroups);
    
    // Synchroniser après réorganisation des groupes
    handleSyncWithServer().catch(err => console.error("Erreur lors de la synchronisation après réorganisation des groupes:", err));
  }, [groups, setGroups, handleSyncWithServer]);
  
  return {
    handleReorder,
    handleGroupReorder
  };
};
