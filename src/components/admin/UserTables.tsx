
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { verifyUserTables } from '@/utils/userTableVerification';

interface UserTablesProps {
  userId: string;
}

const UserTables = ({ userId }: UserTablesProps) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const loadTables = async () => {
    if (!userId) {
      setTables([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Récupération directe depuis l'API qui fonctionne
      const API_URL = getApiUrl();
      console.log(`Chargement direct des tables depuis: ${API_URL}/users.php?action=list_tables&userId=${encodeURIComponent(userId)}`);
      
      const response = await fetch(`${API_URL}/users.php?action=list_tables&userId=${encodeURIComponent(userId)}&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("Réponse PHP/HTML brute:", responseText.substring(0, 200));
        throw new Error("La réponse contient du PHP/HTML au lieu de JSON");
      }
      
      const data = JSON.parse(responseText);
      console.log("Données de tables reçues:", data);
      
      if (data.tables && Array.isArray(data.tables)) {
        setTables(data.tables);
      } else {
        setTables([]);
        console.warn("Format de données invalide pour les tables");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des tables";
      console.error("Erreur de chargement des tables:", errorMessage);
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

  const handleVerifyTables = async () => {
    setVerifying(true);
    try {
      await verifyUserTables(userId);
      toast({
        title: "Vérification réussie",
        description: "Les tables de l'utilisateur ont été vérifiées et complétées si nécessaire.",
        variant: "default"
      });
      
      // Recharger les tables pour voir le résultat
      loadTables();
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la vérification des tables",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTables();
    }
  }, [userId]);

  // Détermine le type d'une table en fonction de son nom
  const getTableType = (tableName: string): string => {
    if (tableName.includes('document')) return 'documents';
    if (tableName.includes('exigence')) return 'exigences';
    if (tableName.includes('collaborateur') || tableName.includes('membres')) return 'membres';
    if (tableName.includes('bibliotheque')) return 'bibliotheque';
    if (tableName.includes('collaboration')) return 'collaboration';
    return 'autre';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Tables de l'utilisateur</CardTitle>
          <p className="text-sm text-muted-foreground">{userId}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTables} 
            disabled={loading || verifying}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyTables}
            disabled={loading || verifying}
          >
            {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Vérifier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading || verifying ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">{verifying ? "Vérification des tables..." : "Chargement..."}</span>
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
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={handleVerifyTables}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Créer les tables
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>Total: {tables.length} tables</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la table</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table, index) => {
                const tableType = getTableType(table);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{table}</TableCell>
                    <TableCell>
                      {tableType === 'membres' && (
                        <Badge variant="secondary">Membres</Badge>
                      )}
                      {tableType === 'exigences' && (
                        <Badge variant="default">Exigences</Badge>
                      )}
                      {tableType === 'documents' && (
                        <Badge variant="outline">Documents</Badge>
                      )}
                      {tableType === 'bibliotheque' && (
                        <Badge variant="secondary">Bibliothèque</Badge>
                      )}
                      {tableType === 'collaboration' && (
                        <Badge variant="default">Collaboration</Badge>
                      )}
                      {tableType === 'autre' && (
                        <Badge variant="outline">Autre</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserTables;
