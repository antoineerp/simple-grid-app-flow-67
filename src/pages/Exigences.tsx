
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Plus, Download } from 'lucide-react';
import { useExigences } from '@/hooks/useExigences';

const Exigences = () => {
  const { exigences, isLoading } = useExigences();

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileCheck className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">Exigences</h1>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Download className="h-4 w-4 mr-2" />
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <div className="text-sm text-gray-600">Exclusion: 0</div>
        </div>
        <div className="bg-red-100 p-3 rounded-lg text-center">
          <div className="text-sm text-red-600">Non conforme: 0</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg text-center">
          <div className="text-sm text-yellow-600">Partiellement conforme: 0</div>
        </div>
        <div className="bg-green-100 p-3 rounded-lg text-center">
          <div className="text-sm text-green-600">Conforme: 0</div>
        </div>
        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <div className="text-sm text-blue-600">Total: 1</div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Exigence</th>
                  <th className="text-center p-3">Responsabilités</th>
                  <th className="text-center p-3">Exclusion</th>
                  <th className="text-center p-3">Atteinte</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
                <tr className="border-b text-sm text-gray-600">
                  <th></th>
                  <th className="text-center p-1">
                    <div className="flex justify-center space-x-2">
                      <span>R</span>
                      <span>A</span>
                      <span>C</span>
                      <span>I</span>
                    </div>
                  </th>
                  <th></th>
                  <th className="text-center p-1">
                    <div className="flex justify-center space-x-2">
                      <span className="text-red-500">NC</span>
                      <span className="text-yellow-500">PC</span>
                      <span className="text-green-500">C</span>
                    </div>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center">
                      <span className="mr-2 text-gray-400">☰</span>
                      Nouvelle exigence 1
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        👤
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        👤
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        👤
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        👤
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <input type="checkbox" className="form-checkbox" />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-red-500">
                        NC
                      </Button>
                      <Button variant="ghost" size="sm" className="text-yellow-500">
                        PC
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-500">
                        C
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        ✏️
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        🗑️
                      </Button>
                    </div>
                  </td>
                </tr>
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
              Ajouter une exigence
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Exigences;
