
import React from 'react';
import { FileDown } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import DocumentStats from '@/components/gestion-documentaire/DocumentStats';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { exportDocumentsToPdf } from '@/services/pdfExport';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const GestionDocumentaireContent = () => {
  const {
    documents,
    stats,
    editingDocument,
    dialogOpen,
    setDialogOpen,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleEdit,
    handleSaveDocument,
    handleDelete,
    handleAddDocument,
    handleReorder
  } = useDocuments();
  
  const { toast } = useToast();

  const handleExportPdf = () => {
    exportDocumentsToPdf(documents);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
          <p className="text-gray-600">Documentation des tâches</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={handleExportPdf}
            className="text-red-500 hover:text-red-700 transition-colors"
            title="Exporter en PDF"
          >
            <FileDown className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <DocumentStats stats={stats} />

      <DocumentTable 
        documents={documents}
        onResponsabiliteChange={handleResponsabiliteChange}
        onAtteinteChange={handleAtteinteChange}
        onExclusionChange={handleExclusionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />

      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleAddDocument}
        >
          Nouveau document
        </Button>
      </div>

      <DocumentForm 
        document={editingDocument}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveDocument}
      />
    </div>
  );
};

const GestionDocumentaire = () => (
  <MembresProvider>
    <GestionDocumentaireContent />
  </MembresProvider>
);

export default GestionDocumentaire;
