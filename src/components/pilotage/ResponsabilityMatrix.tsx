
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useResponsabilityMatrix } from '@/hooks/useResponsabilityMatrix';
import { BarChart3, FileDown } from 'lucide-react';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import { exportCollaborateurStatsToPdf } from '@/services/pdfExport';
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
    exportCollaborateurStatsToPdf(membre);
    toast({
      title: "Export PDF",
      description: `Les statistiques de ${membre.prenom} ${membre.nom} ont été exportées au format PDF`,
    });
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Fonction</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Exigences</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Gestion documentaire</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500" colSpan={4}>Totaux</th>
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
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-yellow-50">R</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-yellow-50">A</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-yellow-50">C</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 bg-yellow-50">I</th>
                </tr>
              </thead>
              <tbody>
                {membreResponsabilites.map((membre) => (
                  <tr key={membre.id} className="border-b bg-yellow-50 hover:bg-yellow-100">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium">{membre.fonction}</div>
                        <div className="text-gray-500 text-xs ml-2">({membre.initiales})</div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button className="ml-2 p-1 hover:bg-gray-200 rounded-full">
                              <BarChart3 className="h-4 w-4 text-gray-500" />
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-60">
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
                                <p className="font-medium mt-2">Total des responsabilités: {getTotalResponsibilities(membre)}</p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </td>
                    
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.r || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.a || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.c || '-'}</td>
                    <td className="px-6 py-3 text-center bg-blue-50">{membre.exigences.i || '-'}</td>
                    
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.r || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.a || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.c || '-'}</td>
                    <td className="px-6 py-3 text-center bg-green-50">{membre.documents.i || '-'}</td>

                    <td className="px-6 py-3 text-center font-medium bg-yellow-50">{(membre.exigences.r + membre.documents.r) || '-'}</td>
                    <td className="px-6 py-3 text-center font-medium bg-yellow-50">{(membre.exigences.a + membre.documents.a) || '-'}</td>
                    <td className="px-6 py-3 text-center font-medium bg-yellow-50">{(membre.exigences.c + membre.documents.c) || '-'}</td>
                    <td className="px-6 py-3 text-center font-medium bg-yellow-50">{(membre.exigences.i + membre.documents.i) || '-'}</td>
                  </tr>
                ))}
                
                {membreResponsabilites.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
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
