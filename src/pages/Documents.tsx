
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

const Documents = () => {
  const { documents, isLoading } = useDocuments();

  const collaborationDocuments = [
    { id: 1, nom: "Documents organisationnels", type: "group" },
    { id: 2, nom: "Documents techniques", type: "group" },
    { id: 3, nom: "Document de référence", lien: "Voir le document" },
    { id: 4, nom: "Document technique", lien: "Voir le document" },
    { id: 5, nom: "N.GCV", lien: "Aucun lien" }
  ];

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">Collaboration</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nom du document</th>
                  <th className="text-left p-3">Lien</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collaborationDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        {doc.type === 'group' && (
                          <span className="mr-2 text-gray-400">▷</span>
                        )}
                        {doc.nom}
                      </div>
                    </td>
                    <td className="p-3">
                      {'lien' in doc ? (
                        doc.lien === "Voir le document" ? (
                          <Button variant="link" className="text-blue-600 p-0">
                            {doc.lien}
                          </Button>
                        ) : (
                          <span className="text-gray-500">{doc.lien}</span>
                        )
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          ×
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau groupe
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
