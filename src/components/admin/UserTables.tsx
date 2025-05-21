
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { getUserTables } from '@/services/users/userManager';
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

interface UserTablesProps {
  userId: string;
}

const UserTables = ({ userId }: UserTablesProps) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log(`Chargement direct des tables depuis: ${API_URL}/test.php?action=tables&userId=${encodeURIComponent(userId)}`);
      
      const response = await fetch(`${API_URL}/test.php?action=tables&userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
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

  useEffect(() => {
    loadTables();
  }, [userId]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-medium">Tables de l'utilisateur</CardTitle>
          <p className="text-sm text-muted-foreground">{userId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTables} disabled={loading}>
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
          <Table>
            <TableCaption>Total: {tables.length} tables</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la table</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{table}</TableCell>
                  <TableCell>
                    {table.includes('membres') ? (
                      <Badge variant="secondary">Membres</Badge>
                    ) : table.includes('exigences') ? (
                      <Badge variant="default">Exigences</Badge>
                    ) : table.includes('documents') ? (
                      <Badge variant="outline">Documents</Badge>
                    ) : (
                      <Badge variant="outline">Autre</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserTables;
