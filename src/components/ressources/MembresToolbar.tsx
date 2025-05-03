
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, PlusCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MembresToolbarProps {
  onSync: () => void;
  lastSynced: Date | null;
  isLoading: boolean;
  error: string | null;
  onAdd?: () => void;
}

const MembresToolbar: React.FC<MembresToolbarProps> = ({ 
  onSync, 
  lastSynced, 
  isLoading, 
  error,
  onAdd
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastSynced && (
            <span>Dernière synchronisation: {lastSynced.toLocaleString()}</span>
          )}
        </div>
        <div className="flex space-x-2">
          {onAdd && (
            <Button 
              size="sm" 
              onClick={onAdd}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Ajouter</span>
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onSync} 
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Synchronisation...' : 'Synchroniser'}</span>
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MembresToolbar;
