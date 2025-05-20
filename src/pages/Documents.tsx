
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Documents = () => {
  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion documentaire</CardTitle>
          <CardDescription>Gérez vos documents et fichiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="text-center text-gray-500">Chargement des documents...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
