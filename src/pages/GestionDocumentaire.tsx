
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';

const GestionDocumentaire = () => {
  const {
    documents,
    groups,
    handleEdit,
    handleDelete,
    handleResponsabiliteChange,
    handleAtteinteChange,
    handleExclusionChange,
    handleReorder,
    handleGroupReorder,
    handleToggleGroup,
    handleEditGroup,
    handleDeleteGroup,
  } = useDocuments();

  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion Documentaire</CardTitle>
            <CardDescription>Gérez vos documents et fichiers importants</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentTable 
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GestionDocumentaire;
