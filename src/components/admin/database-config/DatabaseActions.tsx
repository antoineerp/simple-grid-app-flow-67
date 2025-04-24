
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Database, Save } from 'lucide-react';

interface DatabaseActionsProps {
  loading: boolean;
  saving: boolean;
  testingConnection: boolean;
  onRefresh: () => void;
  onTest: () => void;
  onSave: () => void;
}

const DatabaseActions = ({
  loading,
  saving,
  testingConnection,
  onRefresh,
  onTest,
  onSave
}: DatabaseActionsProps) => {
  return (
    <div className="flex justify-between">
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Recharger
      </Button>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onTest} 
          disabled={testingConnection}
          className="flex items-center gap-2"
        >
          {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Tester
        </Button>
        
        <Button 
          variant="default" 
          onClick={onSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
};

export default DatabaseActions;
