import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import BibliothequeHeader from '@/components/bibliotheque/BibliothequeHeader';
import BibliothequeList from '@/components/bibliotheque/BibliothequeList';
import BibliothequeGroup from '@/components/bibliotheque/BibliothequeGroup';
import DocumentForm from '@/components/bibliotheque/DocumentForm';
import GroupForm from '@/components/bibliotheque/GroupForm';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

const Collaboration = () => {
  const { 
    documents, 
    groups, 
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    setIsEditing,
    setCurrentDocument,
    setCurrentGroup,
    handleAddDocument, 
    handleUpdateDocument, 
    handleDeleteDocument, 
    handleAddGroup, 
    handleUpdateGroup, 
    handleDeleteGroup,
    handleSyncDocuments,
    isSyncing,
    isOnline,
    syncFailed,
    currentUser
  } = useBibliotheque();
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  
  const { toast } = useToast();

  // Filtrer les documents quand searchTerm ou documents change
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [documents, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleOpenAddDocument = () => {
    setCurrentDocument({
      id: uuidv4(),
      name: "",
      link: null,
      userId: currentUser
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEditDocument = (document: Document) => {
    setCurrentDocument({
      ...document,
      userId: document.userId || currentUser
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleOpenAddGroup = () => {
    setCurrentGroup({
      id: uuidv4(),
      name: "",
      expanded: false,
      items: [],
      userId: currentUser
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };

  const handleOpenEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({
      ...group,
      userId: group.userId || currentUser
    });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };

  // Fonction pour supprimer un document
  const handleDelete = (id: string) => {
    handleDeleteDocument(id);
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès",
    });
  };

  // Fonction pour supprimer un groupe
  const handleDeleteGroupFn = (id: string) => {
    handleDeleteGroup(id);
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <BibliothequeHeader 
        onSearch={handleSearch} 
        onAddDocument={handleOpenAddDocument}
        onAddGroup={handleOpenAddGroup}
        onSync={handleSyncDocuments}
        isSyncing={isSyncing}
        isOnline={isOnline}
        syncFailed={syncFailed}
        currentUser={currentUser}
        showOnlyErrors={false}
      />
      
      <div className="mt-6 space-y-4">
        {/* Afficher les groupes */}
        {groups.map(group => (
          <BibliothequeGroup
            key={group.id}
            group={group}
            onEdit={() => handleOpenEditGroup(group)}
            onDelete={handleDeleteGroupFn}
          />
        ))}
        
        {/* Afficher les documents qui ne sont pas dans un groupe */}
        <BibliothequeList 
          documents={filteredDocuments.filter(doc => !doc.groupId)}
          onEdit={handleOpenEditDocument}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialog pour les documents */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DocumentForm
            document={currentDocument}
            groups={groups} // Ajout de la propriété groups manquante
            onSave={(doc) => {
              if (isEditing) {
                handleUpdateDocument(doc);
              } else {
                handleAddDocument(doc);
              }
              setIsDialogOpen(false);
            }}
            onCancel={() => setIsDialogOpen(false)}
            isEditing={isEditing}
            onDelete={isEditing ? handleDeleteDocument : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour les groupes */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <GroupForm
            group={currentGroup}
            onSave={(group) => {
              if (isEditing) {
                handleUpdateGroup(group);
              } else {
                handleAddGroup(group);
              }
              setIsGroupDialogOpen(false);
            }}
            onCancel={() => setIsGroupDialogOpen(false)}
            isEditing={isEditing}
            onDelete={isEditing ? handleDeleteGroup : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Collaboration;
