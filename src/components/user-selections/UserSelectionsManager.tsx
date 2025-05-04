
import React from 'react';
import { useUserSelections } from '@/hooks/useUserSelections';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const UserSelectionsManager: React.FC = () => {
  const {
    checkboxesByCategory,
    isLoading,
    error,
    handleToggle,
    toggleCategory,
    refresh
  } = useUserSelections();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Chargement des sélections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded mb-4">
          <p>Erreur lors du chargement des sélections : {error}</p>
        </div>
        <Button onClick={refresh}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.keys(checkboxesByCategory).length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded">
          <p>Aucune sélection disponible pour le moment.</p>
        </div>
      ) : (
        Object.entries(checkboxesByCategory).map(([category, checkboxes]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between">
                <span>{category}</span>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleCategory(category, true)}
                  >
                    Tout sélectionner
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleCategory(category, false)}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {checkboxes.map((checkbox) => (
                  <div key={checkbox.id} className="flex items-center space-x-2 py-1">
                    <Checkbox 
                      id={`checkbox-${checkbox.id}`} 
                      checked={checkbox.isSelected}
                      onCheckedChange={(checked) => handleToggle(checkbox.id, !!checked)}
                    />
                    <label 
                      htmlFor={`checkbox-${checkbox.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {checkbox.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default UserSelectionsManager;
