
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { PageHeader } from '@/components/ui/page-header';
import { FileText, Plus, Download, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from '@/services/auth/authService';
import { useSyncedData } from '@/hooks/useSyncedData';

// Types pour les documents
interface Document {
  id: number;
  name: string;
  status: 'conforme' | 'non-conforme' | 'partiel';
  lastUpdated: string;
  userId: string;
}

// Types pour les groupes de documents
interface DocumentGroup {
  id: number;
  name: string;
  documents: Document[];
}

const GestionDocumentaire = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddingDocument, setIsAddingDocument] = useState<boolean>(false);
  const [newDocumentName, setNewDocumentName] = useState<string>('');
  
  // Utiliser le hook useSyncedData avec optimisation
  const {
    data: documents,
    updateData: setDocuments,
    isSyncing,
    forceReload,
    repairSync,
  } = useSyncedData<Document>(
    'gestion_documents',
    [],
    async (userId) => {
      console.log("Chargement des documents pour", userId);
      // Simuler un chargement asynchrone (remplacer par un appel API réel)
      const storedData = localStorage.getItem(`gestion_documents_${userId}`);
      
      // Si aucune donnée n'existe, créer des données initiales
      if (!storedData) {
        const initialData: Document[] = [
          {
            id: 1,
            name: "Politique qualité",
            status: "conforme",
            lastUpdated: new Date().toISOString(),
            userId: userId || 'default'
          },
          {
            id: 2,
            name: "Manuel qualité",
            status: "partiel",
            lastUpdated: new Date().toISOString(),
            userId: userId || 'default'
          }
        ];
        return initialData;
      }
      
      return JSON.parse(storedData);
    },
    async (data, userId) => {
      // Sauvegarder les données (simulé - à remplacer par un appel API)
      console.log(`Sauvegarde de ${data.length} documents pour ${userId}`);
      localStorage.setItem(`gestion_documents_${userId}`, JSON.stringify(data));
      
      // Simuler un délai de réseau pour l'effet de synchronisation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    }
  );

  // Filtrer les documents selon le terme de recherche
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ajouter un document
  const handleAddDocument = () => {
    if (!newDocumentName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du document ne peut pas être vide",
        variant: "destructive"
      });
      return;
    }

    const currentUser = getCurrentUser();
    const userId = currentUser?.identifiant_technique || 'default';
    
    // Créer un nouveau document
    const newDocument: Document = {
      id: documents.length > 0 ? Math.max(...documents.map(doc => doc.id)) + 1 : 1,
      name: newDocumentName.trim(),
      status: 'non-conforme', // Statut par défaut
      lastUpdated: new Date().toISOString(),
      userId: userId
    };

    // Utiliser la fonction updateData de useSyncedData
    setDocuments([...documents, newDocument]);
    
    // Réinitialiser les champs
    setNewDocumentName('');
    setIsAddingDocument(false);
    
    toast({
      title: "Document ajouté",
      description: `Le document "${newDocumentName}" a été ajouté avec succès`
    });
  };

  // Exporter les documents
  const handleExport = () => {
    // Logique d'exportation (exemple: CSV)
    const csvContent = [
      ["ID", "Nom", "Statut", "Dernière mise à jour"],
      ...documents.map(doc => [doc.id, doc.name, doc.status, new Date(doc.lastUpdated).toLocaleDateString()])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'documents.csv');
    link.click();
    
    toast({
      title: "Exportation réussie",
      description: "Les documents ont été exportés en format CSV"
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Gestion Documentaire"
        description="Gérez les documents de votre système qualité"
        icon={<FileText className="h-6 w-6" />}
      />
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
          <Button 
            onClick={() => setIsAddingDocument(true)} 
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button 
            onClick={handleExport} 
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Download className="h-4 w-4 mr-2" /> Exporter
          </Button>
        </div>
        
        <div className="relative flex-grow md:max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isAddingDocument && (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
          <h3 className="text-lg font-medium mb-2">Ajouter un nouveau document</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Nom du document"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              className="flex-grow"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddDocument} className="bg-primary">
                Ajouter
              </Button>
              <Button 
                onClick={() => {
                  setIsAddingDocument(false);
                  setNewDocumentName('');
                }} 
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Nom</th>
                <th className="py-2 px-4 text-left">Statut</th>
                <th className="py-2 px-4 text-left">Dernière mise à jour</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{doc.name}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        doc.status === 'conforme' ? 'bg-green-100 text-green-800' :
                        doc.status === 'non-conforme' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status === 'conforme' ? 'Conforme' :
                         doc.status === 'non-conforme' ? 'Non conforme' :
                         'Partiellement conforme'}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {new Date(doc.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <Button variant="ghost" size="sm">Éditer</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    {searchTerm ? 'Aucun document ne correspond à votre recherche' : 'Aucun document disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="flex justify-end mt-4">
        <Button 
          onClick={forceReload} 
          variant="outline" 
          className="mr-2"
          disabled={isSyncing}
        >
          {isSyncing ? "Synchronisation..." : "Rafraîchir"}
        </Button>
        <Button 
          onClick={repairSync} 
          variant="destructive"
          disabled={isSyncing}
        >
          Réparer la synchronisation
        </Button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
