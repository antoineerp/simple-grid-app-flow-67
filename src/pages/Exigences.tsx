import React from 'react';
import { FileDown } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import ExigenceForm from '@/components/exigences/ExigenceForm';
import ExigenceStats from '@/components/exigences/ExigenceStats';
import ExigenceTable from '@/components/exigences/ExigenceTable';
import { useExigences } from '@/hooks/useExigences';
import { exportExigencesToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";

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
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    exportExigencesToPdf(exigences);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Exigences</h1>
          <p className="text-gray-600">Liste des exigences</p>
        </div>
        <button 
          onClick={handleExportPdf}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Exporter en PDF"
        >
          <FileDown className="h-6 w-6" />
        </button>
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
