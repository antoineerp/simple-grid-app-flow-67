
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "@/components/ui/code";
import { Checkbox } from "@/components/ui/checkbox";
import { DatabaseCheck, List, ChevronDown, ChevronUp, ClipboardCopy, CheckCircle } from "lucide-react";
import { generateTableCheckQueries, getDbChecklistItems, generateVerificationReport } from "@/utils/dbChecklistHelper";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * Page d'outil pour aider à vérifier la structure de la base de données
 * en relation avec les points mentionnés dans la checklist
 */
const DatabaseCheckPage: React.FC = () => {
  const { getUserId } = useAuth();
  const { toast } = useToast();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showReport, setShowReport] = useState(false);
  
  const userId = getUserId() || '';
  const checkQueries = generateTableCheckQueries(userId);
  const checklistItems = getDbChecklistItems();
  
  // Fonction pour basculer l'état d'expansion d'un élément
  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Fonction pour marquer un élément comme vérifié
  const toggleChecked = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    
    // Afficher une notification
    toast({
      title: prev[index] ? "Élément décoché" : "Élément vérifié",
      description: checklistItems[index],
      variant: "default",
    });
  };
  
  // Fonction pour copier une requête dans le presse-papiers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copié !",
        description: `La requête ${label} a été copiée dans le presse-papiers`,
        variant: "default",
      });
    }).catch(err => {
      console.error("Erreur lors de la copie :", err);
      toast({
        title: "Erreur",
        description: "Impossible de copier la requête",
        variant: "destructive",
      });
    });
  };
  
  // Fonction pour générer et afficher le rapport
  const handleGenerateReport = () => {
    setShowReport(true);
    toast({
      title: "Rapport généré",
      description: "Le rapport de vérification a été généré",
      variant: "default",
    });
  };
  
  // Vérifier si tous les éléments sont cochés
  const allItemsChecked = checklistItems.length > 0 && 
    checklistItems.every((_, index) => checkedItems[index]);
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DatabaseCheck className="h-6 w-6" />
          Vérification de la structure de base de données
        </h1>
        
        <Button 
          onClick={handleGenerateReport}
          variant={allItemsChecked ? "default" : "outline"}
        >
          {allItemsChecked ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Générer le rapport
            </>
          ) : (
            <>
              <List className="mr-2 h-4 w-4" />
              Compléter la vérification
            </>
          )}
        </Button>
      </div>
      
      {showReport && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rapport de vérification</CardTitle>
            <CardDescription>
              Résumé des vérifications effectuées sur la structure de la base de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <Code className="whitespace-pre-wrap">{generateVerificationReport()}</Code>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(generateVerificationReport(), "rapport")}
            >
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copier le rapport
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Liste de vérification</CardTitle>
            <CardDescription>
              Cochez les éléments au fur et à mesure de votre vérification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {checklistItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Checkbox 
                    id={`check-${index}`} 
                    checked={!!checkedItems[index]} 
                    onCheckedChange={() => toggleChecked(index)} 
                  />
                  <label 
                    htmlFor={`check-${index}`}
                    className={`text-sm ${checkedItems[index] ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Requêtes SQL de vérification</CardTitle>
            <CardDescription>
              Utilisez ces requêtes dans phpMyAdmin pour vérifier la structure de votre base de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(checkQueries).map(([key, query]) => (
                <div key={key} className="border rounded-md overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-3 bg-muted cursor-pointer"
                    onClick={() => toggleExpand(key)}
                  >
                    <h3 className="text-sm font-medium">{key}</h3>
                    <Button variant="ghost" size="icon">
                      {expandedItems[key] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {expandedItems[key] && (
                    <div className="p-3 border-t">
                      <ScrollArea className="h-[200px]">
                        <Code className="text-xs whitespace-pre">{query}</Code>
                      </ScrollArea>
                      <div className="mt-3 flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(query, key)}
                        >
                          <ClipboardCopy className="mr-2 h-3 w-3" />
                          Copier
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Alert>
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                Ces requêtes sont des exemples. Adaptez-les selon votre structure de base de données.
                Assurez-vous d'avoir les droits nécessaires pour exécuter ces requêtes.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseCheckPage;
