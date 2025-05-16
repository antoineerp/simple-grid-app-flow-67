
import React from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import DocumentTableWrapper from '@/components/gestion-documentaire/DocumentTableWrapper';

const GestionDocumentaire: React.FC = () => {
  const {
    documents,
    groups,
    loading,
    handleEdit,
    handleDelete,
    handleReorder,
    handleToggleGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleGroupReorder,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleAddDocument,
    handleAddGroup
  } = useDocuments();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion Documentaire</h1>
        <div className="flex space-x-2">
          <Button onClick={handleAddDocument} className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Ajouter un document</span>
          </Button>
          <Button onClick={handleAddGroup} variant="outline" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Ajouter un groupe</span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <DocumentTableWrapper
              documents={documents}
              groups={groups}
              onResponsabiliteChange={handleResponsabiliteChange}
              onAtteinteChange={handleAtteinteChange}
              onExclusionChange={handleExclusionChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onGroupReorder={handleGroupReorder}
              onToggleGroup={handleToggleGroup}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionDocumentaire;
