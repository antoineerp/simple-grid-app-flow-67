
import React from 'react';
import { FileText } from 'lucide-react';
import { MembresProvider } from '@/contexts/MembresContext';
import DocumentForm from '@/components/gestion-documentaire/DocumentForm';
import DocumentStats from '@/components/gestion-documentaire/DocumentStats';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
          <p className="text-gray-600">Documentation des tâches</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
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
        <button 
          className="btn-primary"
          onClick={handleAddDocument}
        >
          Nouveau document
        </button>
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
