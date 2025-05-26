
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Plus, Download } from 'lucide-react';

const Pilotage = () => {
  const documents = [
    { id: 1, nom: "Charte institutionnelle", lien: "Voir le document" },
    { id: 2, nom: "Objectifs stratégiques", lien: "Aucun lien" },
    { id: 3, nom: "Objectifs opérationnels", lien: "Voir le document" },
    { id: 4, nom: "Risques", lien: "Aucun lien" }
  ];

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">Pilotage</h1>
        </div>
        <Button className="bg-red-500 hover:bg-red-600">
          <Download className="h-4 w-4 mr-2" />
          Générer le rapport
        </Button>
      </div>

      {/* Synthèse de l'atteinte des exigences */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse de l'atteinte des exigences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-red-600">Non Conforme</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-yellow-600">Part. Conforme</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-green-600">Conforme</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="text-sm text-blue-600">Total (sans exclusion)</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Répartition des exigences</h3>
              <div className="w-32 h-32 mx-auto bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">100%</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Statistiques complémentaires</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Exigences exclues :</span>
                  <span className="font-bold">1</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de conformité :</span>
                  <span className="font-bold text-green-600">0%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synthèse de la gestion documentaire */}
      <Card>
        <CardHeader>
          <CardTitle>Synthèse de la gestion documentaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-600">0</div>
              <div className="text-sm text-gray-600">Exclusion</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-red-600">Non Conforme</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-yellow-600">Part. Conforme</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-green-600">Conforme</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Répartition des documents</h3>
              <div className="w-32 h-32 mx-auto bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">100%</span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Statistiques complémentaires</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Documents exclus :</span>
                  <span className="font-bold">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de conformité :</span>
                  <span className="font-bold text-green-600">0%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents de pilotage */}
      <Card>
        <CardHeader>
          <CardTitle>Documents de pilotage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ordre</th>
                  <th className="text-left p-2">Nom du document</th>
                  <th className="text-left p-2">Lien</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b">
                    <td className="p-2">{doc.id}</td>
                    <td className="p-2">{doc.nom}</td>
                    <td className="p-2">
                      {doc.lien === "Voir le document" ? (
                        <Button variant="link" className="text-blue-600 p-0">
                          {doc.lien}
                        </Button>
                      ) : (
                        <span className="text-gray-500">{doc.lien}</span>
                      )}
                    </td>
                    <td className="p-2">
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
          <div className="mt-4 flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matrice des responsabilités */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice des responsabilités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fonction</th>
                  <th className="text-center p-2" colSpan={4}>Exigences</th>
                  <th className="text-center p-2" colSpan={4}>Gestion documentaire</th>
                </tr>
                <tr className="border-b text-sm text-gray-600">
                  <th></th>
                  <th className="text-center p-1">R</th>
                  <th className="text-center p-1">A</th>
                  <th className="text-center p-1">C</th>
                  <th className="text-center p-1">I</th>
                  <th className="text-center p-1">R</th>
                  <th className="text-center p-1">A</th>
                  <th className="text-center p-1">C</th>
                  <th className="text-center p-1">I</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 bg-yellow-100">DXXDXD</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pilotage;
