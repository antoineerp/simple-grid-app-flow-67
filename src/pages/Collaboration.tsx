
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const Collaboration = () => {
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collaboration</CardTitle>
            <CardDescription>Travaillez ensemble sur vos projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-center text-gray-500">Chargement des données de collaboration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Collaboration;
