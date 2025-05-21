
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Download, UserIcon, ClipboardCheck } from "lucide-react";
import { getCurrentUser, connectAsUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

/**
 * Composant pour tester la synchronisation entre différents utilisateurs
 */
const UserSyncTester: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [testUsers, setTestUsers] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [testData, setTestData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Récupérer l'utilisateur actuel au chargement
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Récupérer ou initialiser la liste des utilisateurs de test
    const savedUsers = localStorage.getItem('debug_test_users');
    if (savedUsers) {
      try {
        setTestUsers(JSON.parse(savedUsers));
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs de test:', error);
        setTestUsers([user]);
      }
    } else {
      setTestUsers([user]);
    }
  }, []);

  // Sauvegarder la liste des utilisateurs quand elle change
  useEffect(() => {
    if (testUsers.length > 0) {
      localStorage.setItem('debug_test_users', JSON.stringify(testUsers));
    }
  }, [testUsers]);

  // Ajouter un utilisateur de test
  const addTestUser = () => {
    if (!userInput.trim()) return;
    
    // Ne pas ajouter si l'utilisateur existe déjà
    if (testUsers.includes(userInput.trim())) {
      toast({
        title: "Utilisateur existant",
        description: "Cet utilisateur est déjà dans la liste",
        variant: "destructive"
      });
      return;
    }
    
    // Ajouter le nouvel utilisateur
    setTestUsers(prev => [...prev, userInput.trim()]);
    setUserInput('');
    
    toast({
      title: "Utilisateur ajouté",
      description: `${userInput.trim()} a été ajouté à la liste des utilisateurs de test`
    });
  };

  // Supprimer un utilisateur de test
  const removeTestUser = (user: string) => {
    setTestUsers(prev => prev.filter(u => u !== user));
  };

  // Se connecter en tant qu'utilisateur spécifique
  const connectToUser = async (userId: string) => {
    setLoading(true);
    
    try {
      const success = await connectAsUser(userId);
      
      if (success) {
        setCurrentUser(userId);
        toast({
          title: "Connexion réussie",
          description: `Vous êtes maintenant connecté en tant que ${userId}`
        });
        
        // Rafraîchir la page pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter avec cet utilisateur",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la connexion en tant qu\'utilisateur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Créer des données de test pour l'utilisateur actuel
  const createTestData = () => {
    setLoading(true);
    
    try {
      const userId = getCurrentUser();
      const timestamp = Date.now();
      
      // Créer des données de test pour la bibliothèque
      const bibliothequeDocuments = [
        { id: `test-${timestamp}-1`, name: `Document test ${userId} 1`, link: 'Voir le document' },
        { id: `test-${timestamp}-2`, name: `Document test ${userId} 2`, link: 'Voir le document' }
      ];
      
      const bibliothequeGroups = [
        { id: `group-${timestamp}-1`, name: `Groupe test ${userId} 1`, expanded: false, items: [] }
      ];
      
      // Stocker dans localStorage
      localStorage.setItem(`collaboration_documents_${userId}`, JSON.stringify(bibliothequeDocuments));
      localStorage.setItem(`collaboration_groups_${userId}`, JSON.stringify(bibliothequeGroups));
      
      // Stocker aussi les données de test
      const testDataObj = {
        userId,
        timestamp,
        bibliothequeDocuments,
        bibliothequeGroups
      };
      
      setTestData(testDataObj);
      
      toast({
        title: "Données de test créées",
        description: `Données créées pour l'utilisateur ${userId}`
      });
    } catch (error) {
      console.error('Erreur lors de la création des données de test:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier les données pour l'utilisateur actuel
  const checkUserData = () => {
    setLoading(true);
    
    try {
      const userId = getCurrentUser();
      const results: any = {};
      
      // Vérifier les données de bibliothèque
      const storedDocuments = localStorage.getItem(`collaboration_documents_${userId}`);
      const storedGroups = localStorage.getItem(`collaboration_groups_${userId}`);
      
      results.documents = storedDocuments ? JSON.parse(storedDocuments) : null;
      results.groups = storedGroups ? JSON.parse(storedGroups) : null;
      
      // Vérifier d'autres données
      const keys = Object.keys(localStorage).filter(key => key.includes(userId));
      results.relatedKeys = keys;
      
      setTestData(results);
      
      toast({
        title: "Données vérifiées",
        description: `Données récupérées pour l'utilisateur ${userId}`
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des données utilisateur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
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
        <CardTitle>Testeur de synchronisation multi-utilisateurs</CardTitle>
        <CardDescription>
          Testez la synchronisation des données entre différents utilisateurs
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            <strong>Utilisateur actuel:</strong> {currentUser || "Non connecté"}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-6">
          {/* Section des utilisateurs de test */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Utilisateurs de test</h3>
            
            <div className="flex space-x-2 mb-4">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="ID utilisateur (ex: p71x6d_user1)"
                className="flex-1"
              />
              <Button onClick={addTestUser}>Ajouter</Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {testUsers.map(user => (
                <div 
                  key={user}
                  className={`flex justify-between items-center p-2 rounded-md border ${
                    user === currentUser ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <span className="text-sm font-mono truncate">{user}</span>
                  <div className="flex space-x-1">
                    {user !== currentUser ? (
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => connectToUser(user)}
                        disabled={loading}
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost"
                        size="sm"
                        disabled
                      >
                        <ClipboardCheck className="h-3.5 w-3.5 text-green-500" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTestUser(user)}
                      disabled={loading || testUsers.length <= 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Section des actions de test */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-4">Actions de test</h3>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={createTestData}
                disabled={loading}
                className="flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="h-4 w-4 mr-2" />
                Créer données de test
              </Button>
              
              <Button 
                variant="outline" 
                onClick={checkUserData}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Vérifier données utilisateur
              </Button>
            </div>
          </div>
          
          {/* Section des résultats */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">Résultats</h3>
            
            {Object.keys(testData).length > 0 ? (
              <ScrollArea className="h-[400px]">
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded">
                  {formatJson(testData)}
                </pre>
              </ScrollArea>
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée disponible. Exécutez une action de test.</p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          {loading ? "Opération en cours..." : "Prêt pour les tests de synchronisation"}
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserSyncTester;
