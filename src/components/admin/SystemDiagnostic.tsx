import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { DiagnosticReport, DiagnosticService } from '@/services/diagnostic/DiagnosticService';
import { DiagnosticHeader } from './diagnostic/DiagnosticHeader';
import { DiagnosticReportView } from './diagnostic/DiagnosticReport';
import { toast } from '@/components/ui/use-toast';
import { FileSearch, FileWarning, AlertTriangle, UploadCloud } from 'lucide-react';

export const SystemDiagnostic = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("structure");
  const [structureReport, setStructureReport] = useState<DiagnosticReport | null>(null);
  const [deploymentReport, setDeploymentReport] = useState<DiagnosticReport | null>(null);
  const [completeReport, setCompleteReport] = useState<DiagnosticReport | null>(null);
  
  const runStructureDiagnostic = async () => {
    setLoading(true);
    try {
      const report = await DiagnosticService.runStructureDiagnostic();
      setStructureReport(report);
      toast({
        title: "Diagnostic terminé",
        description: report.status === 'success' ? "L'analyse de la structure est terminée avec succès" : report.message,
        variant: report.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du diagnostic",
        variant: "destructive",
      });
      console.error("Erreur lors du diagnostic de structure:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const runDeploymentDiagnostic = async () => {
    setLoading(true);
    try {
      const report = await DiagnosticService.runDeploymentDiagnostic();
      setDeploymentReport(report);
      toast({
        title: "Diagnostic terminé",
        description: report.status === 'success' ? "L'analyse du déploiement est terminée avec succès" : report.message,
        variant: report.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du diagnostic",
        variant: "destructive",
      });
      console.error("Erreur lors du diagnostic de déploiement:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const runCompleteDiagnostic = async () => {
    setLoading(true);
    setActiveTab("complete");
    try {
      console.log("Lancement du diagnostic complet...");
      const report = await DiagnosticService.runCompleteDiagnostic();
      console.log("Diagnostic complet terminé:", report);
      setCompleteReport(report);
      toast({
        title: "Diagnostic complet terminé",
        description: report.status === 'success' ? "Le diagnostic complet est terminé avec succès" : report.message,
        variant: report.status === 'success' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error("Erreur lors du diagnostic complet:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du diagnostic complet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Diagnostic système</CardTitle>
        <CardDescription>Analyse et préparation du système pour le nettoyage</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Structure des fichiers
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              Déploiement
            </TabsTrigger>
            <TabsTrigger value="complete" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Diagnostic complet
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structure">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Analyse de la structure des fichiers</CardTitle>
                <CardDescription>
                  Vérifie la structure des répertoires et des fichiers nécessaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Cette analyse vérifie les dossiers essentiels, les fichiers de configuration et 
                  les assets requis pour le bon fonctionnement de l'application.
                </p>
                
                <Button 
                  onClick={runStructureDiagnostic} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FileSearch className="h-4 w-4" />
                  {loading && activeTab === "structure" ? "Analyse en cours..." : "Analyser la structure"}
                </Button>
                
                {structureReport && (
                  <DiagnosticReportView report={structureReport} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deployment">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Vérification du déploiement</CardTitle>
                <CardDescription>
                  Vérifie que tous les éléments sont correctement déployés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Cette analyse vérifie que les fichiers JavaScript, CSS et les assets 
                  sont correctement déployés et accessibles.
                </p>
                
                <Button 
                  onClick={runDeploymentDiagnostic} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <UploadCloud className="h-4 w-4" />
                  {loading && activeTab === "deployment" ? "Vérification en cours..." : "Vérifier le déploiement"}
                </Button>
                
                {deploymentReport && (
                  <DiagnosticReportView report={deploymentReport} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="complete">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Diagnostic complet</CardTitle>
                <CardDescription>
                  Analyse complète de l'installation et préparation du nettoyage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Cette analyse effectue une vérification complète de l'installation, 
                  incluant les connexions à la base de données, la configuration serveur,
                  et les dépendances système.
                </p>
                
                <Button 
                  onClick={runCompleteDiagnostic} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FileWarning className="h-4 w-4" />
                  {loading && activeTab === "complete" ? "Analyse complète en cours..." : "Analyser et préparer le nettoyage"}
                </Button>
                
                {completeReport && (
                  <DiagnosticReportView report={completeReport} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
