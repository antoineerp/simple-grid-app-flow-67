
import React from 'react';
import { 
  Plus, 
  FolderPlus, 
  FileText, 
  Folder, 
  Search,
  FolderOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useBibliotheque } from "@/hooks/useBibliotheque";
import { Document, DocumentGroup } from "@/types/bibliotheque";
import DocumentForm from "@/components/bibliotheque/DocumentForm";
import GroupForm from "@/components/bibliotheque/GroupForm";
import SyncIndicator from "@/components/common/SyncIndicator";

const Bibliotheque: React.FC = () => {
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
    lastSynced,
    syncFailed
  } = useBibliotheque();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  
  // Filtrer les documents en fonction du terme de recherche
  const filteredDocuments = React.useMemo(() => {
    if (!searchTerm.trim()) return documents;
    
    const term = searchTerm.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(term) ||
      groups.find(g => g.id === doc.groupId)?.name.toLowerCase().includes(term)
    );
  }, [documents, groups, searchTerm]);
  
  // Fonction pour ouvrir/fermer un groupe
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Fonction pour créer un nouveau document
  const handleNewDocument = () => {
    setCurrentDocument({
      id: `doc-${Date.now()}`,
      name: "",
      link: "",
      groupId: undefined
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };
  
  // Fonction pour créer un nouveau groupe
  const handleNewGroup = () => {
    setCurrentGroup({
      id: `group-${Date.now()}`,
      name: "",
      expanded: false,
      items: []
    });
    setIsEditing(false);
    setIsGroupDialogOpen(true);
  };
  
  // Fonction pour éditer un document existant
  const handleEditDocument = (doc: Document) => {
    setCurrentDocument({ ...doc });
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  // Fonction pour éditer un groupe existant
  const handleEditGroup = (group: DocumentGroup) => {
    setCurrentGroup({ ...group });
    setIsEditing(true);
    setIsGroupDialogOpen(true);
  };
  
  return (
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-app-blue">Bibliothèque de documents</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleNewGroup}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau groupe
          </Button>
          <Button onClick={handleNewDocument}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau document
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <SyncIndicator
          isSyncing={isSyncing}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSyncDocuments}
        />
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        {/* Documents sans groupe */}
        <div className="p-4 border-b">
          <h2 className="font-medium mb-2">Documents non classés</h2>
          <div className="space-y-2">
            {filteredDocuments
              .filter(doc => !doc.groupId)
              .map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => handleEditDocument(doc)}
                >
                  <FileText className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{doc.name}</span>
                </div>
              ))}
          </div>
        </div>
        
        {/* Groupes et leurs documents */}
        {groups.map(group => {
          const groupDocs = filteredDocuments.filter(doc => doc.groupId === group.id);
          const isOpen = openGroups[group.id] || false;
          
          return (
            <div key={group.id} className="p-4 border-b">
              <div 
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center">
                  {isOpen ? 
                    <FolderOpen className="mr-2 h-4 w-4 text-app-blue" /> : 
                    <Folder className="mr-2 h-4 w-4 text-app-blue" />
                  }
                  <h2 className="font-medium">{group.name}</h2>
                  <span className="ml-2 text-xs text-gray-500">
                    ({groupDocs.length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGroup(group);
                    }}
                  >
                    Éditer
                  </Button>
                </div>
              </div>
              
              {isOpen && (
                <div className="space-y-2 ml-6 mt-2">
                  {groupDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      onClick={() => handleEditDocument(doc)}
                    >
                      <FileText className="mr-2 h-4 w-4 text-gray-500" />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Dialog for document form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm 
            document={currentDocument}
            isEditing={isEditing}
            groups={groups}
            onSave={isEditing ? handleUpdateDocument : handleAddDocument}
            onCancel={() => setIsDialogOpen(false)}
            onDelete={isEditing ? handleDeleteDocument : undefined}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog for group form */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le groupe" : "Ajouter un groupe"}
            </DialogTitle>
          </DialogHeader>
          <GroupForm 
            group={currentGroup}
            isEditing={isEditing}
            onSave={isEditing ? handleUpdateGroup : handleAddGroup}
            onCancel={() => setIsGroupDialogOpen(false)}
            onDelete={isEditing ? handleDeleteGroup : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bibliotheque;
