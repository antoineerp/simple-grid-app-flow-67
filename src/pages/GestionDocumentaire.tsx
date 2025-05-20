
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';
import { useDocuments } from '@/hooks/useDocuments';
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from 'lucide-react';

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
    handleAddDocument,
    handleAddGroup,
    setDialogOpen,
    setGroupDialogOpen,
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
            <div className="flex justify-end mb-4 space-x-2">
              <Button 
                variant="outline"
                className="hover:bg-gray-100 transition-colors"
                onClick={() => setGroupDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nouveau groupe
              </Button>
              <Button 
                variant="default"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </div>
            
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
