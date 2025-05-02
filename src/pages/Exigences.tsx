
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ExigencesPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Exigences</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des exigences</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenu des exigences en cours de chargement...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExigencesPage;
