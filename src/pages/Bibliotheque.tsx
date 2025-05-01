
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import BibliothequeHeader from '@/components/bibliotheque/BibliothequeHeader';
import BibliothequeList from '@/components/bibliotheque/BibliothequeList';
import BibliothequeGroup from '@/components/bibliotheque/BibliothequeGroup';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { v4 as uuidv4 } from 'uuid';
import { bibliothequeService } from '@/services/bibliotheque/bibliothequeService';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const Bibliotheque = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [currentUser, setCurrentUser] = useState<string>(getDatabaseConnectionCurrentUser() || 'default');
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Charger les données initiales
    const loadedDocs = bibliothequeService.loadDocuments();
    if (loadedDocs && loadedDocs.length > 0) {
      // Assurer que tous les documents ont un userId
      const docsWithUser = loadedDocs.map(doc => ({
        ...doc,
        userId: doc.userId || currentUser
      }));
      setDocuments(docsWithUser);
    } else {
      const initialDocs = bibliothequeService.getInitialDocuments();
      setDocuments(initialDocs);
    }

    const loadedGroups = bibliothequeService.loadGroups();
    if (loadedGroups && loadedGroups.length > 0) {
      // Assurer que tous les groupes ont un userId
      const groupsWithUser = loadedGroups.map(group => ({
        ...group,
        userId: group.userId || currentUser
      }));
      setGroups(groupsWithUser);
    } else {
      const initialGroups = bibliothequeService.getInitialGroups();
      setGroups(initialGroups);
    }
  }, [currentUser]);

  useEffect(() => {
    // Filtrer les documents selon le terme de recherche
    if (!searchTerm) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchTerm]);

  // Sauvegarder les documents quand ils changent
  useEffect(() => {
    bibliothequeService.saveDocuments(documents);
  }, [documents]);

  // Sauvegarder les groupes quand ils changent
  useEffect(() => {
    bibliothequeService.saveGroups(groups);
  }, [groups]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleAddDocument = () => {
    const newDocument: Document = {
      id: uuidv4(),
      name: "Nouveau document",
      link: "",
      groupId: undefined,
      userId: currentUser
    };
    setDocuments([...documents, newDocument]);
    toast({
      title: "Document ajouté",
      description: "Le nouveau document a été ajouté à la bibliothèque",
    });
  };

  const handleAddGroup = () => {
    const newGroup: DocumentGroup = {
      id: uuidv4(),
      name: "Nouveau groupe",
      expanded: false,
      items: [],
      userId: currentUser
    };
    setGroups([...groups, newGroup]);
    toast({
      title: "Groupe ajouté",
      description: "Le nouveau groupe a été ajouté à la bibliothèque",
    });
  };

  const handleEditDocument = (document: Document) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === document.id ? document : doc
    );
    setDocuments(updatedDocuments);
    toast({
      title: "Document modifié",
      description: "Le document a été modifié avec succès",
    });
  };

  const handleEditGroup = (group: DocumentGroup) => {
    const updatedGroups = groups.map(g =>
      g.id === group.id ? group : g
    );
    setGroups(updatedGroups);
    toast({
      title: "Groupe modifié",
      description: "Le groupe a été modifié avec succès",
    });
  };

  const handleDeleteDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé de la bibliothèque",
    });
  };

  const handleDeleteGroup = (id: string) => {
    const updatedGroups = groups.filter(group => group.id !== id);
    setGroups(updatedGroups);
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé de la bibliothèque",
    });
  };
  
  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    // Simulation d'une synchronisation
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Synchronisation terminée",
        description: "Les données ont été synchronisées avec succès"
      });
    }, 2000);
    return Promise.resolve();
  };

  return (
    <div className="container mx-auto p-4">
      <BibliothequeHeader 
        onSearch={handleSearch} 
        onAddDocument={handleAddDocument} 
        onAddGroup={handleAddGroup}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      
      <div className="mt-6 space-y-4">
        {/* Afficher les groupes */}
        {groups.map(group => (
          <BibliothequeGroup
            key={group.id}
            group={group}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
            documents={documents.filter(doc => doc.groupId === group.id)}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        ))}
        
        {/* Afficher les documents qui ne sont pas dans un groupe */}
        <BibliothequeList 
          documents={filteredDocuments.filter(doc => !doc.groupId)}
          onEditDocument={handleEditDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      </div>
    </div>
  );
};

export default Bibliotheque;
