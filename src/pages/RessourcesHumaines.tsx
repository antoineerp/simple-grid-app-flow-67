
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, PlusCircle, Trash2, Users } from 'lucide-react';
import { MembresProvider, useMembres } from '@/contexts/MembresContext';
import { MembresTable } from '@/components/ressources/MembresTable';
import MembresToolbar from '@/components/ressources/MembresToolbar';
import { Membre } from '@/types/membres';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const RessourcesHumainesContent: React.FC = () => {
  const navigate = useNavigate();
  const { 
    membres, 
    isLoading, 
    error, 
    refreshMembres,
    syncMembres,
    lastSynced,
    syncFailed
  } = useMembres();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // Filtrer les membres
  const filteredMembres = membres.filter(membre => {
    // Filtre par recherche
    const matchesSearch = !searchTerm || 
      membre.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membre.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membre.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Filtre par département
    const matchesDept = !selectedDept || membre.departement === selectedDept;
    
    return matchesSearch && matchesDept;
  });

  // Liste des départements uniques
  const departments = [...new Set(membres.map(m => m.departement).filter(Boolean))];

  // Gérer la synchronisation
  const handleSync = async () => {
    try {
      const success = await syncMembres();
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les données des membres ont été synchronisées avec succès.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la synchronisation",
          description: "Une erreur s'est produite lors de la synchronisation des membres.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ressources Humaines</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser
          </Button>
          
          <Button variant="default" size="sm" onClick={() => navigate('/rh/nouveau-membre')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouveau membre
          </Button>
        </div>
      </div>
      
      {/* Carte d'information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2" />
            Membres de l'équipe
          </CardTitle>
          <CardDescription>
            {membres.length} membres au total
            {lastSynced && (
              <span className="text-xs block text-muted-foreground">
                Dernière synchronisation: {lastSynced.toLocaleString()} 
                {syncFailed && <span className="text-red-500"> (Échec)</span>}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Barre d'outils pour la recherche et le filtrage */}
          <MembresToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            departments={departments}
            selectedDepartment={selectedDept}
            onDepartmentChange={setSelectedDept}
          />
        </CardContent>
        
        <CardContent>
          {error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-md">
              Erreur: {error}
            </div>
          ) : (
            <MembresTable
              membres={filteredMembres}
              isLoading={isLoading}
              onDelete={(membre) => {
                // Logique de suppression
                toast({
                  title: "Membre supprimé",
                  description: `${membre.prenom} ${membre.nom} a été supprimé.`,
                });
              }}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={refreshMembres}>
            Rafraîchir les données
          </Button>
          
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer la sélection
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Composant principal avec le provider
const RessourcesHumaines: React.FC = () => (
  <MembresProvider>
    <RessourcesHumainesContent />
  </MembresProvider>
);

export default RessourcesHumaines;
