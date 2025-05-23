
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Documentation des API par page
const ApiDocumentation: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Documentation API de l'application</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="exigences">Exigences</TabsTrigger>
          <TabsTrigger value="membres">Ressources Humaines</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>API Gestion des Utilisateurs</CardTitle>
              <CardDescription>Page: Administration &gt; Gestion des Utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[150px]">Endpoint</TableHead>
                      <TableHead className="w-[100px]">Méthode</TableHead>
                      <TableHead className="w-[200px]">Paramètres</TableHead>
                      <TableHead className="w-[200px]">Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Récupérer tous les utilisateurs</TableCell>
                      <TableCell><code>/api/users.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>_nocache=timestamp</code></TableCell>
                      <TableCell><code>{"{ records: Utilisateur[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Supprimer un utilisateur</TableCell>
                      <TableCell><code>/api/users.php</code></TableCell>
                      <TableCell><code>DELETE</code></TableCell>
                      <TableCell><code>{"{ id: string }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vérifier les tables</TableCell>
                      <TableCell><code>/api/users.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>action=ensure_tables</code></TableCell>
                      <TableCell><code>{"{ success: boolean, results: any[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vérifier tables d'un utilisateur</TableCell>
                      <TableCell><code>/api/users.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>action=create_tables_for_user&userId=X</code></TableCell>
                      <TableCell><code>{"{ success: boolean, tables_created: string[] }"}</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>API Gestion Documentaire</CardTitle>
              <CardDescription>Page: Gestion des Documents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[150px]">Endpoint</TableHead>
                      <TableHead className="w-[100px]">Méthode</TableHead>
                      <TableHead className="w-[200px]">Paramètres</TableHead>
                      <TableHead className="w-[200px]">Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Récupérer les documents</TableCell>
                      <TableCell><code>/api/documents-sync.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>userId=X</code></TableCell>
                      <TableCell><code>{"{ documents: Document[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Synchroniser documents</TableCell>
                      <TableCell><code>/api/documents-sync.php</code></TableCell>
                      <TableCell><code>POST</code></TableCell>
                      <TableCell><code>{"{ userId: string, documents: Document[], userPrefix: string }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean, count: number }"}</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exigences">
          <Card>
            <CardHeader>
              <CardTitle>API Exigences</CardTitle>
              <CardDescription>Page: Exigences</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[150px]">Endpoint</TableHead>
                      <TableHead className="w-[100px]">Méthode</TableHead>
                      <TableHead className="w-[200px]">Paramètres</TableHead>
                      <TableHead className="w-[200px]">Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Récupérer exigences</TableCell>
                      <TableCell><code>/api/exigences-sync.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>userId=X</code></TableCell>
                      <TableCell><code>{"{ exigences: Exigence[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Synchroniser exigences</TableCell>
                      <TableCell><code>/api/exigences-sync.php</code></TableCell>
                      <TableCell><code>POST</code></TableCell>
                      <TableCell><code>{"{ userId: string, exigences: Exigence[] }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean, count: number }"}</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="membres">
          <Card>
            <CardHeader>
              <CardTitle>API Ressources Humaines</CardTitle>
              <CardDescription>Page: Ressources Humaines</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[150px]">Endpoint</TableHead>
                      <TableHead className="w-[100px]">Méthode</TableHead>
                      <TableHead className="w-[200px]">Paramètres</TableHead>
                      <TableHead className="w-[200px]">Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Récupérer membres</TableCell>
                      <TableCell><code>/api/membres-sync.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell><code>userId=X</code></TableCell>
                      <TableCell><code>{"{ membres: Membre[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Synchroniser membres</TableCell>
                      <TableCell><code>/api/membres-sync.php</code></TableCell>
                      <TableCell><code>POST</code></TableCell>
                      <TableCell><code>{"{ userId: string, membres: Membre[] }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean }"}</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>API Système</CardTitle>
              <CardDescription>Pages: Login, Paramètres, Tableaux de bord</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Fonction</TableHead>
                      <TableHead className="w-[150px]">Endpoint</TableHead>
                      <TableHead className="w-[100px]">Méthode</TableHead>
                      <TableHead className="w-[200px]">Paramètres</TableHead>
                      <TableHead className="w-[200px]">Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Authentification</TableCell>
                      <TableCell><code>/api/auth.php</code></TableCell>
                      <TableCell><code>POST</code></TableCell>
                      <TableCell><code>{"{ email: string, password: string }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean, token: string, utilisateur: Utilisateur }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vérifier la connexion API</TableCell>
                      <TableCell><code>/api/check-users.php</code></TableCell>
                      <TableCell><code>GET</code></TableCell>
                      <TableCell>Aucun</TableCell>
                      <TableCell><code>{"{ success: boolean, records: Utilisateur[] }"}</code></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Synchronisation générique</TableCell>
                      <TableCell><code>/api/robust-sync.php</code></TableCell>
                      <TableCell><code>POST</code></TableCell>
                      <TableCell><code>{"{ userId: string, tableName: string, records: any[] }"}</code></TableCell>
                      <TableCell><code>{"{ success: boolean, count: number }"}</code></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Résumé des appels API par page</CardTitle>
          <CardDescription>
            Nombre d'appels API et chemins par page principale de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Page</TableHead>
                <TableHead className="w-[100px]">Nombre d'appels</TableHead>
                <TableHead>Endpoints utilisés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Login (Index)</TableCell>
                <TableCell>1-2</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/auth.php</code> - Authentification</li>
                    <li><code>/api/check-users.php</code> - Vérification connexion</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dashboard</TableCell>
                <TableCell>1</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/users.php?action=create_tables_for_user</code> - Vérification tables</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Gestion des Utilisateurs</TableCell>
                <TableCell>2-4</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/users.php</code> - Liste utilisateurs</li>
                    <li><code>/api/users.php</code> - Suppression utilisateur (DELETE)</li>
                    <li><code>/api/users.php?action=ensure_tables</code> - Vérification toutes tables</li>
                    <li><code>/api/users.php?action=create_tables_for_user</code> - Tables par utilisateur</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Gestion Documentaire</TableCell>
                <TableCell>2</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/documents-sync.php</code> (GET) - Charger documents</li>
                    <li><code>/api/documents-sync.php</code> (POST) - Sauvegarder documents</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Exigences</TableCell>
                <TableCell>2</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/exigences-sync.php</code> (GET) - Charger exigences</li>
                    <li><code>/api/exigences-sync.php</code> (POST) - Sauvegarder exigences</li>
                  </ul>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Ressources Humaines</TableCell>
                <TableCell>2</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    <li><code>/api/membres-sync.php</code> (GET) - Charger membres</li>
                    <li><code>/api/membres-sync.php</code> (POST) - Sauvegarder membres</li>
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          Note: Tous les appels API sont maintenant gérés par le service central dans 
          <code> src/services/api/apiService.ts</code>. Chaque page utilise les méthodes 
          exposées par ce service, ce qui assure la cohérence des appels API dans toute l'application.
        </p>
      </div>
    </div>
  );
};

export default ApiDocumentation;
