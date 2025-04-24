import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useResponsabilityMatrix } from '@/hooks/useResponsabilityMatrix';
import { BarChart3, FileDown } from 'lucide-react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import { exportCollaborateurStatsToPdf } from '@/services/collaborateurExport';
import { useToast } from "@/hooks/use-toast";

const ResponsibilityMatrix: React.FC = () => {
  const { membreResponsabilites } = useResponsabilityMatrix();
  const { toast } = useToast();

  const getTotalResponsibilities = (membre) => {
    const exigencesTotal = membre.exigences.r + membre.exigences.a + membre.exigences.c + membre.exigences.i;
    const documentsTotal = membre.documents.r + membre.documents.a + membre.documents.c + membre.documents.i;
    return exigencesTotal + documentsTotal;
  };

  const handleExportPdf = (membre) => {
    try {
      console.log("Export PDF pour:", membre.prenom, membre.nom);
      exportCollaborateurStatsToPdf(membre);
      toast({
        title: "Export PDF",
        description: `Les statistiques de ${membre.prenom} ${membre.nom} ont été exportées au format PDF`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      toast({
        title: "Erreur d'export",
        description: `Une erreur est survenue: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Matrice des responsabilités</h2>
      </div>
      
      <Card className="overflow-hidden border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Collaborateur</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Exigences</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Gestion documentaire</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Total</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3"></th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">R</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">A</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">C</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-blue-50">I</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">R</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">A</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">C</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-green-50">I</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-yellow-50">Σ</th>
                </tr>
              </thead>
              <tbody>
                {membreResponsabilites.map((membre) => {
                  const totalResponsibilities = getTotalResponsibilities(membre);
                  return (
                    <tr key={membre.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex flex-col">
                            <span className="font-medium">{membre.prenom} {membre.nom}</span>
                            <span className="text-gray-500 text-xs">{membre.fonction} ({membre.initiales})</span>
                          </div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button className="ml-2 p-1 hover:bg-gray-200 rounded-full">
                                <BarChart3 className="h-4 w-4 text-gray-500" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold">{membre.prenom} {membre.nom}</h4>
                                  <button
                                    onClick={() => handleExportPdf(membre)}
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                    title="Exporter en PDF"
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="text-sm">
                                  <p className="font-medium">Exigences:</p>
                                  <ul className="pl-4 text-xs">
                                    <li>Responsable: {membre.exigences.r}</li>
                                    <li>Approbateur: {membre.exigences.a}</li>
                                    <li>Consulté: {membre.exigences.c}</li>
                                    <li>Informé: {membre.exigences.i}</li>
                                  </ul>
                                  <p className="font-medium mt-2">Documents:</p>
                                  <ul className="pl-4 text-xs">
                                    <li>Responsable: {membre.documents.r}</li>
                                    <li>Approbateur: {membre.documents.a}</li>
                                    <li>Consulté: {membre.documents.c}</li>
                                    <li>Informé: {membre.documents.i}</li>
                                  </ul>
                                  <p className="font-medium mt-2">Total des responsabilités: {totalResponsibilities}</p>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      </td>
                      
                      <td className={`px-6 py-3 text-center bg-blue-50 font-medium ${membre.exigences.r > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {membre.exigences.r || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-blue-50 font-medium ${membre.exigences.a > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {membre.exigences.a || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-blue-50 font-medium ${membre.exigences.c > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {membre.exigences.c || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-blue-50 font-medium ${membre.exigences.i > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {membre.exigences.i || '-'}
                      </td>
                      
                      <td className={`px-6 py-3 text-center bg-green-50 font-medium ${membre.documents.r > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {membre.documents.r || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-green-50 font-medium ${membre.documents.a > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {membre.documents.a || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-green-50 font-medium ${membre.documents.c > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {membre.documents.c || '-'}
                      </td>
                      <td className={`px-6 py-3 text-center bg-green-50 font-medium ${membre.documents.i > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                        {membre.documents.i || '-'}
                      </td>
                      
                      <td className={`px-6 py-3 text-center bg-yellow-50 font-semibold ${totalResponsibilities > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
                        {totalResponsibilities || '-'}
                      </td>
                    </tr>
                  );
                })}
                
                {membreResponsabilites.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
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

export default ResponsibilityMatrix;
