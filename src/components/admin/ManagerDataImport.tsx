
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { adminImportFromManager } from '@/services/core/userInitializationService';

interface ManagerDataImportProps {
  hasManager: boolean;
}

const ManagerDataImport = ({ hasManager }: ManagerDataImportProps) => {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    
    try {
      const success = await adminImportFromManager();
      
      if (success) {
        toast({
          title: "Import réussi",
          description: "Les données du gestionnaire ont été importées avec succès",
        });
      } else {
        setError("L'importation a échoué pour une raison inconnue");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur s'est produite lors de l'importation");
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'importer les données du gestionnaire",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (!hasManager) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import des données du gestionnaire</CardTitle>
          <CardDescription>
            Synchronisez vos données avec celles du gestionnaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun compte gestionnaire n'a été trouvé dans le système. Vous devez d'abord créer un compte gestionnaire.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import des données du gestionnaire</CardTitle>
        <CardDescription>
          Synchronisez vos données avec celles du gestionnaire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          En tant qu'administrateur, vous pouvez importer les dernières modifications apportées par le gestionnaire.
          Cela remplacera vos données actuelles par celles du gestionnaire.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={importing}
          className="w-full"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importation en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Importer les données du gestionnaire
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ManagerDataImport;
