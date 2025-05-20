
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DocumentTable from '@/components/gestion-documentaire/DocumentTable';

const GestionDocumentaire = () => {
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestion Documentaire</CardTitle>
            <CardDescription>Gérez vos documents et fichiers importants</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GestionDocumentaire;
