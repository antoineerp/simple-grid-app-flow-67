
import React from 'react';
import { Card } from "@/components/ui/card";
import { PageHeader } from '@/components/ui/page-header';
import { FileText } from 'lucide-react';

const GestionDocumentaire = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Gestion Documentaire"
        description="Gérez les documents de votre système qualité"
        icon={<FileText className="h-6 w-6" />}
      />
      
      <Card className="p-6">
        <p>Contenu de la gestion documentaire</p>
      </Card>
    </div>
  );
};

export default GestionDocumentaire;
