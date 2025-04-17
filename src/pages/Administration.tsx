
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, UserPlus, LogIn } from 'lucide-react';
import { getUtilisateurs, getDatabaseInfo, connectAsUser, type Utilisateur } from '@/services/databaseService';
import { useToast } from "@/hooks/use-toast";

const Administration = () => {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [loading, setLoading] = useState({ users: false, dbInfo: false });

  const loadUtilisateurs = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const data = await getUtilisateurs();
      setUtilisateurs(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const loadDatabaseInfo = async () => {
    setLoading(prev => ({ ...prev, dbInfo: true }));
    try {
      const info = await getDatabaseInfo();
      setDbInfo(info);
    } catch (error) {
      console.error("Erreur lors du chargement des informations de la base de données", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de la base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, dbInfo: false }));
    }
  };

  const handleConnectAsUser = async (identifiantTechnique: string) => {
    await connectAsUser(identifiantTechnique);
  };

  useEffect(() => {
    loadUtilisateurs();
    loadDatabaseInfo();
  }, []);

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Administration du système</h1>
      
      <Tabs defaultValue="utilisateurs">
        <TabsList className="mb-8">
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilisateurs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>Visualisez et gérez les utilisateurs du système</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadUtilisateurs} disabled={loading.users}>
                  {loading.users ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Actualiser</span>
                </Button>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Liste des utilisateurs enregistrés dans le système</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Identifiant technique</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilisateurs.length === 0 && !loading.users ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    utilisateurs.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.nom, user.prenom)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.prenom} {user.nom}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.identifiant_technique}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.date_creation}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleConnectAsUser(user.identifiant_technique)}
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Connecter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Informations sur la base de données</CardTitle>
                <CardDescription>Détails de la connexion et statistiques</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadDatabaseInfo} disabled={loading.dbInfo}>
                {loading.dbInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Actualiser</span>
              </Button>
            </CardHeader>
            <CardContent>
              {dbInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Configuration</h3>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Hôte:</div>
                        <div>{dbInfo.host}</div>
                        <div className="font-medium">Base de données:</div>
                        <div>{dbInfo.database}</div>
                        <div className="font-medium">Statut:</div>
                        <div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {dbInfo.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Statistiques</h3>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Taille totale:</div>
                        <div>{dbInfo.size}</div>
                        <div className="font-medium">Nombre de tables:</div>
                        <div>{dbInfo.tables}</div>
                        <div className="font-medium">Dernière sauvegarde:</div>
                        <div>{dbInfo.lastBackup}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
