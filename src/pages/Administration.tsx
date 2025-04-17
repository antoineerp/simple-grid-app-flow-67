import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Database, UserPlus, LogIn, AlertTriangle, ServerCrash, CheckCircle2 } from 'lucide-react';
import { 
  getUtilisateurs, 
  getDatabaseInfo, 
  connectAsUser, 
  testDatabaseConnection,
  getCurrentUser,
  type Utilisateur
} from '@/services';
import { useToast } from "@/hooks/use-toast";

const Administration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [loading, setLoading] = useState({ users: false, dbInfo: false, connection: false });
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', role: 'utilisateur' });
  
  const [currentDatabaseUser, setCurrentDatabaseUser] = useState<string | null>(getCurrentUser());

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin' && userRole !== 'administrateur') {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les droits pour accéder à cette page.",
        variant: "destructive",
      });
      navigate('/pilotage');
      return;
    }

    loadUtilisateurs();
    loadDatabaseInfo();
    setCurrentDatabaseUser(getCurrentUser());
  }, [navigate]);

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
    const success = await connectAsUser(identifiantTechnique);
    if (success) {
      setCurrentDatabaseUser(identifiantTechnique);
    }
  };

  const handleTestConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }));
    try {
      await testDatabaseConnection();
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Fonctionnalité en développement",
      description: "La création d'utilisateur sera disponible dans une prochaine version.",
    });
    setNewUserOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    if (status === "Online") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    } else if (status === "Warning") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <ServerCrash className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Administration du système</h1>
      
      {currentDatabaseUser && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="font-medium text-blue-800">
            Vous êtes actuellement connecté à la base de données en tant que: <span className="font-bold">{currentDatabaseUser}</span>
          </p>
        </div>
      )}
      
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
                <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouvel utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                      <DialogDescription>
                        Ajoutez un nouvel utilisateur au système.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="nom" className="text-right text-sm">Nom</label>
                          <Input
                            id="nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="prenom" className="text-right text-sm">Prénom</label>
                          <Input
                            id="prenom"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="email" className="text-right text-sm">Email</label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="role" className="text-right text-sm">Rôle</label>
                          <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                          >
                            <option value="utilisateur">Utilisateur</option>
                            <option value="gestionnaire">Gestionnaire</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Créer l'utilisateur</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
                            disabled={currentDatabaseUser === user.identifiant_technique}
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            {currentDatabaseUser === user.identifiant_technique ? 'Connecté' : 'Connecter'}
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadDatabaseInfo} disabled={loading.dbInfo}>
                  {loading.dbInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Actualiser</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={loading.connection}>
                  {loading.connection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  <span className="ml-2">Tester la connexion</span>
                </Button>
              </div>
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
                          {getStatusBadge(dbInfo.status)}
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
            <CardFooter className="flex justify-between bg-muted/10">
              <p className="text-xs text-muted-foreground">
                Les informations présentées ici sont obtenues en temps réel depuis la base de données.
              </p>
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour: {new Date().toLocaleString()}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Administration;
