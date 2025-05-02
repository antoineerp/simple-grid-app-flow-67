
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MembresPage = () => {
  const membres = [
    { id: 1, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@example.com', fonction: 'Directeur' },
    { id: 2, nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@example.com', fonction: 'Responsable Qualité' },
    { id: 3, nom: 'Petit', prenom: 'Pierre', email: 'pierre.petit@example.com', fonction: 'Technicien' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des membres</h1>
        <Button>Ajouter un membre</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membres.map((membre) => (
                <TableRow key={membre.id}>
                  <TableCell>{membre.nom}</TableCell>
                  <TableCell>{membre.prenom}</TableCell>
                  <TableCell>{membre.email}</TableCell>
                  <TableCell>{membre.fonction}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Éditer</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembresPage;
