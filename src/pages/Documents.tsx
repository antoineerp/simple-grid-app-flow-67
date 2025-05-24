
import React from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from '@/hooks/useDocuments';
import DocumentTable from '@/components/documents/DocumentTable';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';

const Documents = () => {
  const {
    documents,
    groups,
    editingDocument,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleAddGroup
  } = useDocuments();

  const { toast } = useToast();

  const handleExportPdf = () => {
    if (documents && documents.length > 0) {
      toast({
        title: "Export PDF",
        description: "Fonctionnalité d'export en cours de développement",
      });
    } else {
      toast({
        title: "Export impossible",
        description: "Aucun document disponible à exporter",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Gestion documentaire</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <DocumentTable 
        documents={documents}
        groups={groups}
        onResponsabiliteChange={handleResponsabiliteChange}
        onAtteinteChange={handleAtteinteChange}
        onExclusionChange={handleExclusionChange}
        onEdit={(id) => handleEdit(documents.find(d => d.id === id)!)}
        onDelete={handleDelete}
        onReorder={handleReorder}
        onGroupReorder={handleGroupReorder}
        onToggleGroup={handleToggleGroup}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onAddDocument={handleAddDocument}
      />
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          onClick={handleAddGroup}
          className="hover:bg-gray-100 transition-colors mr-2"
          title="Nouveau groupe"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={handleAddDocument}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau document
        </Button>
      </div>

      <DocumentForm 
        document={editingDocument}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDocument}
      />

      <DocumentGroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
    </div>
  );
};

export default Documents;
