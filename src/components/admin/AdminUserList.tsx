
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulation de chargement des utilisateurs
    const loadUsers = async () => {
      try {
        // Simuler une attente réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Exemple de données utilisateurs
        const mockUsers: User[] = [
          { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Administrateur', status: 'active' },
          { id: '2', name: 'John Doe', email: 'john@example.com', role: 'Éditeur', status: 'active' },
          { id: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'Utilisateur', status: 'inactive' }
        ];
        
        setUsers(mockUsers);
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [toast]);

  const handleAddUser = () => {
    toast({
      title: "Fonctionnalité en développement",
      description: "L'ajout d'utilisateurs sera bientôt disponible"
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestion des utilisateurs</CardTitle>
          <CardDescription>Liste des comptes utilisateurs</CardDescription>
        </div>
        
        <Button onClick={handleAddUser} variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
                      user.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Éditer</span>
                    </Button>
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

export default AdminUserList;
