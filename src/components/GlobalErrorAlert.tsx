
import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const GlobalErrorAlert = () => {
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Écouter les erreurs globales
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setError(`${event.message} (${event.filename}:${event.lineno})`);
      setVisible(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || 'Une promesse a été rejetée sans être gérée';
      setError(errorMessage);
      setVisible(true);
    };

    // Écouter les erreurs non capturées
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Si pas d'erreur ou erreur masquée, ne rien afficher
  if (!error || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant="destructive" className="relative">
        <XCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Erreur système</AlertTitle>
        <AlertDescription className="mt-2 max-w-[300px] break-words">
          {error}
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          &times;
        </Button>
      </Alert>
    </div>
  );
};

export default GlobalErrorAlert;
