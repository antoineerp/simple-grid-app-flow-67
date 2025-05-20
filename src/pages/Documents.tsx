
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentTable from '@/components/documents/DocumentTable';
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from 'lucide-react';

const Documents = () => {
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
    setDialogOpen,
    setGroupDialogOpen,
    isSyncing
  } = useDocuments();

  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion documentaire</CardTitle>
            <CardDescription>Gérez vos documents et fichiers</CardDescription>
          </CardHeader>
          <CardContent>
            {isSyncing ? (
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-center text-gray-500">Chargement des documents...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
