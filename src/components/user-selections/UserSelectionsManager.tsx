
import React, { useState } from 'react';
import { useUserSelections } from '@/hooks/useUserSelections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RefreshCw, CheckSquare, Square, Save } from 'lucide-react';

const UserSelectionsManager: React.FC = () => {
  const {
    checkboxesByCategory,
    isLoading,
    error,
    handleToggle,
    toggleCategory,
    refresh,
    handleBulkUpdate
  } = useUserSelections();

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Gérer l'expansion/contraction des catégories
  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };

  // Sauvegarder toutes les sélections
  const handleSaveAll = () => {
    const selectedIds = Object.values(checkboxesByCategory)
      .flat()
      .filter(checkbox => checkbox.isSelected)
      .map(checkbox => checkbox.id);
    
    handleBulkUpdate(selectedIds);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>Une erreur est survenue lors du chargement des sélections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Mes sélections</CardTitle>
            <CardDescription>Gérez vos préférences et synchronisez-les sur tous vos appareils</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <div className="pl-6 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(checkboxesByCategory).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune sélection disponible</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Accordion 
              type="multiple" 
              value={expandedCategories}
              className="w-full"
            >
              {Object.entries(checkboxesByCategory).map(([category, items]) => {
                const allSelected = items.every(item => item.isSelected);
                const someSelected = items.some(item => item.isSelected);
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger 
                      onClick={() => handleToggleCategory(category)}
                      className="py-2 hover:no-underline"
                    >
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>{category}</span>
                        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground mr-2">
                            {items.filter(i => i.isSelected).length}/{items.length} sélectionnés
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs p-1"
                              onClick={() => toggleCategory(category, true)}
                            >
                              <CheckSquare className="h-3.5 w-3.5 mr-1" />
                              Tout
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-7 text-xs p-1"
                              onClick={() => toggleCategory(category, false)}
                            >
                              <Square className="h-3.5 w-3.5 mr-1" />
                              Aucun
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-1">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 pl-6 pr-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center space-x-2 py-1">
                            <Checkbox 
                              id={`checkbox-${item.id}`} 
                              checked={item.isSelected} 
                              onCheckedChange={(checked) => handleToggle(item.id, checked === true)}
                            />
                            <label 
                              htmlFor={`checkbox-${item.id}`} 
                              className="text-sm cursor-pointer"
                            >
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveAll}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder toutes les sélections
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSelectionsManager;
