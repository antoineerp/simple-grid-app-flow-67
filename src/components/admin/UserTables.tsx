
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, RefreshCw } from 'lucide-react';
import { getUserTables } from '@/services/users/userManager';
import { useToast } from "@/hooks/use-toast";

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
      const userTables = await getUserTables(userId);
      setTables(userTables);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des tables";
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
          <div className="py-4 text-center text-destructive">
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
