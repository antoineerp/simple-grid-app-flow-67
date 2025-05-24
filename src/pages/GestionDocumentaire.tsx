
// Page Gestion Documentaire simplifiée sans MembresProvider
import React, { useState } from 'react';
import { FileText, Plus, FolderPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from '@/hooks/useDocuments';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { DocumentGroupDialog } from '@/components/gestion-documentaire/DocumentGroupDialog';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';

const GestionDocumentaire = () => {
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
    handleDelete,
    handleAddDocument,
    handleSaveDocument,
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

  // Helper function to cast etat to correct type
  const castEtat = (etat: any): 'NC' | 'PC' | 'C' | 'EX' | null => {
    if (etat === 'NC' || etat === 'PC' || etat === 'C' || etat === 'EX') {
      return etat;
    }
    return null;
  };

  // Transform documents to match expected format
  const transformedDocuments = documents.map(doc => ({
    ...doc,
    responsabilites: doc.responsabilites || { r: [], a: [], c: [], i: [] },
    fichier_path: doc.fichier_path || null,
    etat: castEtat(doc.etat),
    date_creation: doc.date_creation || new Date(),
    date_modification: doc.date_modification || new Date()
  }));

  // Transform groups to match expected format
  const transformedGroups = groups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
      fichier_path: item.fichier_path || null,
      etat: castEtat(item.etat),
      date_creation: item.date_creation || new Date(),
      date_modification: item.date_modification || new Date()
    }))
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Gestion Documentaire</h1>
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
        documents={transformedDocuments}
        groups={transformedGroups}
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

      <DocumentGroupDialog
        group={editingGroup ? {
          ...editingGroup,
          items: editingGroup.items.map(item => ({
            ...item,
            responsabilites: item.responsabilites || { r: [], a: [], c: [], i: [] },
            fichier_path: item.fichier_path || null,
            etat: castEtat(item.etat),
            date_creation: item.date_creation || new Date(),
            date_modification: item.date_modification || new Date()
          }))
        } : null}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
      
      <DocumentForm 
        document={editingDocument ? {
          ...editingDocument,
          responsabilites: editingDocument.responsabilites || { r: [], a: [], c: [], i: [] },
          fichier_path: editingDocument.fichier_path || null,
          etat: castEtat(editingDocument.etat),
          date_creation: editingDocument.date_creation || new Date(),
          date_modification: editingDocument.date_modification || new Date()
        } : null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDocument}
      />
    </div>
  );
};

export default GestionDocumentaire;
