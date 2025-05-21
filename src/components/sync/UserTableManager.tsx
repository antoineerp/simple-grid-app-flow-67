
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { TableCell, TableHeader, TableRow, TableHead, TableBody, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { validateUserId } from '@/services/core/apiInterceptor';
import { secureGet } from '@/services/core/apiInterceptor';
import { verifyUserTables } from '@/utils/userTableVerification';

// Définition des types pour les tables
interface TableInfo {
  name: string;
  type: 'documents' | 'exigences' | 'membres' | 'pilotage' | 'bibliotheque' | 'autre';
  exists: boolean;
}

const UserTableManager = () => {
  const [userId, setUserId] = useState<string>('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Liste des tables essentielles
  const essentialTables = [
    { name: 'documents', type: 'documents' as const },
    { name: 'exigences', type: 'exigences' as const },
    { name: 'membres', type: 'membres' as const },
    { name: 'pilotage', type: 'pilotage' as const },
    { name: 'bibliotheque', type: 'bibliotheque' as const }
  ];

  // Charger les tables de l'utilisateur
  const loadUserTables = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'ID utilisateur actuel
      const currentUserId = validateUserId();
      setUserId(currentUserId);

      // Charger les tables depuis l'API
      const response = await secureGet<{tables: string[], status: string}>(`test.php?action=tables&userId=${encodeURIComponent(currentUserId)}`);
      
      if (!response.tables || !Array.isArray(response.tables)) {
        throw new Error("Format de réponse invalide pour les tables");
      }
      
      // Analyser les tables existantes
      const userTablesList = response.tables;
      console.log(`Tables trouvées pour ${currentUserId}:`, userTablesList);
      
      // Préparer la liste des tables à afficher
      const tableInfos: TableInfo[] = [];
      
      // Ajouter d'abord les tables essentielles (qu'elles existent ou non)
      essentialTables.forEach(essentialTable => {
        const fullTableName = `${essentialTable.name}_${currentUserId}`;
        const exists = userTablesList.includes(fullTableName);
        
        tableInfos.push({
          name: essentialTable.name,
          type: essentialTable.type,
          exists
        });
      });
      
      // Ajouter les autres tables spécifiques à l'utilisateur
      userTablesList.forEach(tableName => {
        // Ignorer les tables déjà traitées (essentielles)
        if (essentialTables.some(t => tableName === `${t.name}_${currentUserId}`)) {
          return;
        }
        
        // Déterminer le type de table
        let tableType: TableInfo['type'] = 'autre';
        if (tableName.includes('documents')) tableType = 'documents';
        else if (tableName.includes('exigences')) tableType = 'exigences';
        else if (tableName.includes('membres')) tableType = 'membres';
        else if (tableName.includes('pilotage')) tableType = 'pilotage';
        else if (tableName.includes('bibliotheque')) tableType = 'bibliotheque';
        
        // Ajouter à la liste
        tableInfos.push({
          name: tableName,
          type: tableType,
          exists: true
        });
      });
      
      setTables(tableInfos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des tables";
      console.error("Erreur:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier et créer les tables manquantes
  const handleCreateMissingTables = async () => {
    setIsChecking(true);
    
    try {
      const result = await verifyUserTables(userId);
      
      if (result) {
        toast({
          title: "Vérification terminée",
          description: "Toutes les tables sont correctement configurées.",
        });
      } else {
        toast({
          title: "Tables créées",
          description: "Les tables manquantes ont été créées avec succès.",
        });
      }
      
      // Recharger la liste des tables
      await loadUserTables();
    } catch (error) {
      console.error("Erreur lors de la création des tables:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création des tables",
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadUserTables();
  }, []);

  // Vérifier si des tables essentielles sont manquantes
  const hasMissingEssentialTables = tables.some(table => 
    essentialTables.some(essential => essential.name === table.name && !table.exists)
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Tables de l'utilisateur</CardTitle>
          <p className="text-sm text-muted-foreground">ID: {userId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUserTables} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center py-4 text-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune table trouvée pour cet utilisateur.</p>
          </div>
        ) : (
          <>
            {hasMissingEssentialTables && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-yellow-800">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <p className="font-medium">Tables requises manquantes</p>
                </div>
                <p className="text-sm mt-1">
                  Certaines tables essentielles pour cet utilisateur n'existent pas.
                  Utilisez le bouton ci-dessous pour les créer.
                </p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de la table</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table, index) => (
                  <TableRow key={index} className={!table.exists ? "bg-red-50" : undefined}>
                    <TableCell className="font-medium">
                      {table.name}
                      {!table.exists && <span className="text-red-600 ml-1">*</span>}
                    </TableCell>
                    <TableCell>
                      {table.type === 'documents' && <Badge variant="outline">Documents</Badge>}
                      {table.type === 'exigences' && <Badge>Exigences</Badge>}
                      {table.type === 'membres' && <Badge variant="secondary">Membres</Badge>}
                      {table.type === 'pilotage' && <Badge variant="default">Pilotage</Badge>}
                      {table.type === 'bibliotheque' && <Badge variant="outline">Bibliothèque</Badge>}
                      {table.type === 'autre' && <Badge variant="outline">Autre</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {table.exists ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Présente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Manquante
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Total: {tables.length} tables ({tables.filter(t => t.exists).length} présentes)
        </p>
        {hasMissingEssentialTables && (
          <Button 
            onClick={handleCreateMissingTables} 
            disabled={isChecking || loading}
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Créer les tables manquantes
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserTableManager;
