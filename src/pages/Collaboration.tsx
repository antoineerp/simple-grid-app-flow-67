
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BibliothequeTable } from '@/features/bibliotheque/components/BibliothequeTable';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { Button } from '@/components/ui/button';
import { PlusCircle, FolderPlus } from 'lucide-react';
import DocumentDialog from '@/features/bibliotheque/components/DocumentDialog';
import GroupDialog from '@/features/bibliotheque/components/GroupDialog';
import { useToast } from '@/hooks/use-toast';

const Collaboration = () => {
  const { toast } = useToast();
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<DocumentGroup | null>(null);
  
  // Exemple de données pour la démo - dans un cas réel, ces données viendraient d'une API
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Organigramme', link: 'https://example.com/organigramme', userId: 'user1' },
    { id: '2', name: 'Administration', link: 'https://example.com/admin', userId: 'user1' }
  ]);
  
  const [groups, setGroups] = useState<DocumentGroup[]>([
    { id: 'g1', name: 'Documents organisationnels', isExpanded: true },
    { id: 'g2', name: 'Documents administratifs', isExpanded: true }
  ]);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    g1: true,
    g2: true
  });
  
  const handleAddDocument = () => {
    setSelectedDocument(null);
    setIsDocumentDialogOpen(true);
  };
  
  const handleAddGroup = () => {
    setSelectedGroup(null);
    setIsGroupDialogOpen(true);
  };
  
  const handleEditDocument = (document: Document, group?: DocumentGroup) => {
    setSelectedDocument(document);
    setSelectedGroup(group || null);
    setIsDocumentDialogOpen(true);
  };
  
  const handleEditGroup = (group: DocumentGroup) => {
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };
  
  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast({
      title: "Document supprimé",
      description: "Le document a été supprimé avec succès"
    });
  };
  
  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(group => group.id !== id));
    setDocuments(documents.map(doc => 
      doc.groupId === id ? { ...doc, groupId: undefined } : doc
    ));
    toast({
      title: "Groupe supprimé",
      description: "Le groupe a été supprimé avec succès"
    });
  };
  
  const handleSaveDocument = (document: Document) => {
    if (selectedDocument) {
      // Mise à jour d'un document existant
      setDocuments(documents.map(doc => 
        doc.id === document.id ? document : doc
      ));
      toast({
        title: "Document mis à jour",
        description: "Le document a été mis à jour avec succès"
      });
    } else {
      // Ajout d'un nouveau document
      setDocuments([...documents, document]);
      toast({
        title: "Document créé",
        description: "Le document a été créé avec succès"
      });
    }
    setIsDocumentDialogOpen(false);
  };
  
  const handleSaveGroup = (group: DocumentGroup) => {
    if (selectedGroup) {
      // Mise à jour d'un groupe existant
      setGroups(groups.map(g => 
        g.id === group.id ? group : g
      ));
      toast({
        title: "Groupe mis à jour",
        description: "Le groupe a été mis à jour avec succès"
      });
    } else {
      // Ajout d'un nouveau groupe
      setGroups([...groups, group]);
      setExpandedGroups({ ...expandedGroups, [group.id]: true });
      toast({
        title: "Groupe créé",
        description: "Le groupe a été créé avec succès"
      });
    }
    setIsGroupDialogOpen(false);
  };
  
  const handleToggleGroup = (id: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [id]: !expandedGroups[id]
    });
    setGroups(groups.map(group =>
      group.id === id ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  };
  
  const handleReorder = (startIndex: number, endIndex: number, targetGroupId?: string) => {
    // Implémentation simplifiée - dans un cas réel, cela serait plus complexe
    toast({
      title: "Ordre modifié",
      description: "L'ordre des documents a été modifié"
    });
  };
  
  const handleGroupReorder = (startIndex: number, endIndex: number) => {
    // Implémentation simplifiée - dans un cas réel, cela serait plus complexe
    toast({
      title: "Ordre modifié",
      description: "L'ordre des groupes a été modifié"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Collaboration</h1>
      
      <Card className="mb-6">
        <CardHeader className="bg-app-light-blue">
          <CardTitle className="text-app-blue">
            Gestion des documents collaboratifs
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex justify-end mb-6 space-x-2">
            <Button 
              variant="outline" 
              onClick={handleAddGroup}
              className="flex items-center"
            >
              <FolderPlus className="mr-2 h-5 w-5" />
              Nouveau groupe
            </Button>
            <Button 
              onClick={handleAddDocument}
              className="flex items-center"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Nouveau document
            </Button>
          </div>
          
          <BibliothequeTable 
            documents={documents}
            groups={groups}
            onEdit={handleEditDocument}
            onDelete={(id, isGroup) => isGroup ? handleDeleteGroup(id) : handleDeleteDocument(id)}
            onReorder={handleReorder}
            onGroupReorder={handleGroupReorder}
            onToggleGroup={handleToggleGroup}
          />
        </CardContent>
      </Card>
      
      <DocumentDialog 
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
        document={selectedDocument}
        onSave={handleSaveDocument}
        groups={groups}
      />
      
      <GroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        group={selectedGroup}
        onSave={handleSaveGroup}
      />
    </div>
  );
};

export default Collaboration;
