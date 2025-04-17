
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useResponsabilityMatrix } from '@/hooks/useResponsabilityMatrix';
import { FileText } from 'lucide-react';

const ResponsabilityMatrix: React.FC = () => {
  const { membreResponsabilites } = useResponsabilityMatrix();

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Matrice des responsabilités</h2>
        <FileText className="text-red-500 h-5 w-5" />
      </div>
      
      <Card className="overflow-hidden border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Fonction</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Exigences</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Gestion documentaire</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3"></th>
                  {/* Exigences Headers */}
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">R</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">A</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">C</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">I</th>
                  {/* Documents Headers */}
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">R</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">A</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">C</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">I</th>
                </tr>
              </thead>
              <tbody>
                {membreResponsabilites.map((membre) => (
                  <tr key={membre.id} className="border-b bg-yellow-50 hover:bg-yellow-100">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="font-medium">{membre.fonction}</div>
                      <div className="text-gray-500 text-xs">({membre.initiales})</div>
                    </td>
                    
                    {/* Exigences Counts */}
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.r || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.a || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.c || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.i || '-'}</td>
                    
                    {/* Documents Counts */}
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.r || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.a || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.c || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.i || '-'}</td>
                  </tr>
                ))}
                
                {membreResponsabilites.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      Aucun collaborateur trouvé. Ajoutez des collaborateurs dans la section Ressources Humaines.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsabilityMatrix;
