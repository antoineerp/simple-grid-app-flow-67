
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useCollaboration } from '@/hooks/useCollaboration';

const Collaboration = () => {
  const { data, isLoading, error } = useCollaboration();
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collaboration</CardTitle>
            <CardDescription>Travaillez ensemble sur vos projets</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-center text-gray-500">Chargement des données de collaboration...</p>
              </div>
            ) : error ? (
              <div className="p-4 border border-red-200 rounded-md bg-red-50">
                <p className="text-center text-red-500">Erreur lors du chargement des données</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data && data.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.map((item) => (
                      <div key={item.id} className="border rounded-md p-4">
                        <h3 className="font-medium">{item.titre || item.nom}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Aucune donnée de collaboration disponible</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Collaboration;
