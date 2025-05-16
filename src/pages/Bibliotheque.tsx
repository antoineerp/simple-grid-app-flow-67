
import React from 'react';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const Bibliotheque: React.FC = () => {
  const {
    items,
    loading,
    error,
    isSyncing,
    isOnline,
    addItem,
    updateItem,
    deleteItem
  } = useBibliotheque();

  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Filtrer les éléments en fonction du terme de recherche
  const filteredItems = React.useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddItem = async () => {
    const title = prompt("Titre du document:");
    if (!title) return;
    
    const description = prompt("Description (optionnel):");
    
    await addItem({
      title,
      description: description || undefined,
      author: "Utilisateur actuel"
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <Button onClick={handleAddItem}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Afficher des squelettes pendant le chargement
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-0">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mt-4" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <p className="mb-2">Aucun document trouvé</p>
            <Button variant="outline" onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
          </div>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-xs text-gray-500">
                  {item.author && <>Par {item.author} • </>}
                  {item.date_creation.toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {item.description || "Aucune description"}
                </p>
                
                <div className="flex justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newTitle = prompt("Nouveau titre:", item.title);
                      if (newTitle) updateItem(item.id, { title: newTitle });
                    }}
                  >
                    Éditer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
                        deleteItem(item.id);
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-md shadow flex items-center">
          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
          <span>Synchronisation...</span>
        </div>
      )}
      
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-3 py-2 rounded-md shadow flex items-center">
          <span>Mode hors ligne</span>
        </div>
      )}
    </div>
  );
};

export default Bibliotheque;
