
import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import ExigenceForm from '@/components/exigences/ExigenceForm';
import ExigenceStats from '@/components/exigences/ExigenceStats';
import ExigenceTable from '@/components/exigences/ExigenceTable';
import { useExigences } from '@/hooks/useExigences';

const ExigencesContent = () => {
  const {
    exigences,
    stats,
    editingExigence,
    dialogOpen,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveExigence,
    handleDelete,
    handleAddExigence,
    handleReorder
  } = useExigences();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Exigences</h1>
          <p className="text-gray-600">Liste des exigences</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <ExigenceStats stats={stats} />

      <ExigenceTable 
        exigences={exigences}
        onResponsabiliteChange={handleResponsabiliteChange}
        onAtteinteChange={handleAtteinteChange}
        onExclusionChange={handleExclusionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />

      <div className="flex justify-end mt-4">
        <button 
          className="btn-primary"
          onClick={handleAddExigence}
        >
          Ajouter une exigence
        </button>
      </div>

      <ExigenceForm 
        exigence={editingExigence}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveExigence}
      />
    </div>
  );
};

const Exigences = () => (
  <MembresProvider>
    <ExigencesContent />
  </MembresProvider>
);

export default Exigences;
