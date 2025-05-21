
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DatabaseIcon, Server, HardDrive } from "lucide-react";
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { loadBibliothequeFromStorage } from '@/services/bibliotheque/bibliothequeService';
import { loadCollaborationFromStorage } from '@/services/collaboration/collaborationService';

/**
 * Composant pour comparer les données locales et serveur
 */
const TableDataComparison: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [localStorage, setLocalStorage] = useState<any>({});
  const [serverData, setServerData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>('bibliotheque');

  // Collecter les données au chargement
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    collectLocalData();
  }, []);

  // Collecter les données locales de toutes les tables
  const collectLocalData = () => {
    setLoading(true);
    
    try {
      // Récupérer les données de la bibliothèque
      const bibliothequeData = loadBibliothequeFromStorage();
      
      // Récupérer les données de collaboration
      const collaborationData = loadCollaborationFromStorage();
      
      // Récupérer d'autres données du localStorage
      const localData = {
        bibliotheque: bibliothequeData,
        collaboration: collaborationData
      };
      
      setLocalStorage(localData);
      toast({
        title: "Données locales récupérées",
        description: "Les données ont été récupérées du localStorage"
      });
      
      return localData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données locales:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : String(error)
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les données du serveur
  const fetchServerData = async () => {
    setLoading(true);
    
    try {
      const userId = getCurrentUser();
      const apiUrl = getApiUrl();
      const results: Record<string, any> = {};
      
      // Liste des tables à vérifier
      const tables = ['bibliotheque', 'collaboration', 'documents', 'membres'];
      
      // Récupération des données pour chaque table via l'API
      for (const table of tables) {
        try {
          // Endpoint supposé pour la récupération de données par table
          const response = await fetch(`${apiUrl}/db-fetch.php?table=${table}&userId=${userId}`, {
            method: 'GET',
            headers: {
              ...getAuthHeaders(),
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          const data = await response.json();
          results[table] = data;
        } catch (error) {
          console.error(`Erreur lors de la récupération des données de ${table}:`, error);
          results[table] = {
            error: true, 
            message: error instanceof Error ? error.message : String(error)
          };
        }
      }
      
      setServerData(results);
      toast({
        title: "Données serveur récupérées",
        description: "Les données ont été récupérées du serveur"
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du serveur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : String(error)
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour comparer les données locales et serveur
  const compareData = async () => {
    setLoading(true);
    
    try {
      // Récupérer les données locales
      const localData = collectLocalData();
      
      // Récupérer les données du serveur
      const serverResults = await fetchServerData();
      
      toast({
        title: "Comparaison terminée",
        description: "Les données locales et serveur ont été comparées"
      });
    } catch (error) {
      console.error('Erreur lors de la comparaison des données:', error);
      toast({
        variant: "destructive",
        title: "Erreur de comparaison",
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Formater les données JSON pour l'affichage
  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Erreur de formatage: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des données</CardTitle>
        <CardDescription>
          Compare les données stockées localement et sur le serveur pour l'utilisateur {currentUser}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            onClick={compareData}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comparer les données
          </Button>
          
          <Button 
            variant="outline" 
            onClick={collectLocalData}
            disabled={loading}
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Récupérer données locales
          </Button>
          
          <Button 
            variant="outline" 
            onClick={fetchServerData}
            disabled={loading}
          >
            <Server className="h-4 w-4 mr-2" />
            Récupérer données serveur
          </Button>
        </div>
        
        <Tabs 
          defaultValue="bibliotheque" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="bibliotheque">Bibliothèque</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bibliotheque" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Données locales
                </h3>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {localStorage.bibliotheque ? formatJson(localStorage.bibliotheque) : "Aucune donnée"}
                  </pre>
                </ScrollArea>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  Données serveur
                </h3>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {serverData.bibliotheque ? formatJson(serverData.bibliotheque) : "Aucune donnée"}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="collaboration" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Données locales
                </h3>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {localStorage.collaboration ? formatJson(localStorage.collaboration) : "Aucune donnée"}
                  </pre>
                </ScrollArea>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  Données serveur
                </h3>
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {serverData.collaboration ? formatJson(serverData.collaboration) : "Aucune donnée"}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          {loading ? "Chargement des données en cours..." : "Dernier rafraîchissement: " + new Date().toLocaleTimeString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TableDataComparison;
