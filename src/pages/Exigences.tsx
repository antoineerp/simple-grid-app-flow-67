
import React from 'react';
import { FileText, FolderPlus } from 'lucide-react';
import { useExigences } from '@/hooks/useExigences';
import ExigenceForm from '@/components/exigences/ExigenceForm';
import ExigenceStats from '@/components/exigences/ExigenceStats';
import ExigenceTable from '@/components/exigences/ExigenceTable';
import { ExigenceGroupDialog } from '@/components/exigences/ExigenceGroupDialog';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Exigences = () => {
  const {
    exigences,
    groups,
    editingExigence,
    editingGroup,
    dialogOpen,
    groupDialogOpen,
    setDialogOpen,
    setGroupDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder,
    handleAddGroup,
    handleEditGroup,
    handleSaveGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleToggleGroup
  } = useExigences();
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    toast({
      title: "Export PDF",
      description: "Fonctionnalité d'export en cours de développement",
    });
  };

  // Transform stats to match expected format
  const stats = {
    exclusion: exigences.filter(e => e.excluded).length,
    nonConforme: exigences.filter(e => e.etat === 'NC').length,
    partiellementConforme: exigences.filter(e => e.etat === 'PC').length,
    conforme: exigences.filter(e => e.etat === 'C').length,
    total: exigences.length
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Exigences</h1>
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

      <ExigenceStats stats={stats} />

      {exigences.length > 0 ? (
        <ExigenceTable 
          exigences={exigences}
          groups={groups}
          onResponsabiliteChange={handleResponsabiliteChange}
          onAtteinteChange={handleAtteinteChange}
          onExclusionChange={handleExclusionChange}
          onEdit={(id) => handleEdit(exigences.find(e => e.id === id)!)}
          onDelete={(id) => handleDelete(id)}
          onReorder={handleReorder}
          onGroupReorder={handleGroupReorder}
          onToggleGroup={handleToggleGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucune exigence trouvée. Cliquez sur "Ajouter une exigence" pour commencer.</p>
        </div>
      )}

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
          onClick={handleAddExigence}
        >
          Ajouter une exigence
        </Button>
      </div>

      <ExigenceForm 
        exigence={editingExigence}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveExigence}
      />

      <ExigenceGroupDialog
        group={editingGroup}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={handleSaveGroup}
        isEditing={!!editingGroup}
      />
    </div>
  );
};

export default Exigences;
