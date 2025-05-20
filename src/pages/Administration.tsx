
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const Administration = () => {
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription>Gérez les paramètres de l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-center text-gray-500">Chargement des paramètres d'administration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Administration;
