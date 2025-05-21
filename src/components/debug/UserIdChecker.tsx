
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCurrentUser, setCurrentUser } from '@/services/core/databaseConnectionService';
import { AlertCircle, CheckCircle, UserCheck } from "lucide-react";

/**
 * Composant pour vérifier et afficher l'identifiant utilisateur actuel
 */
const UserIdChecker: React.FC = () => {
  const [currentUser, setCurrentUserState] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    // Récupérer l'utilisateur actuel
    const userId = getCurrentUser();
    setCurrentUserState(userId);
    
    // Vérifier si l'utilisateur est valide
    const isDefaultUser = userId === 'p71x6d_system';
    setIsValid(!isDefaultUser);
    
    // Écouter les changements d'utilisateur
    const handleUserChange = (event: CustomEvent<{userId: string}>) => {
      setCurrentUserState(event.detail.userId);
      setIsValid(event.detail.userId !== 'p71x6d_system');
    };
    
    window.addEventListener('userChanged', handleUserChange as EventListener);
    window.addEventListener('database-user-changed', handleUserChange as EventListener);
    
    return () => {
      window.removeEventListener('userChanged', handleUserChange as EventListener);
      window.removeEventListener('database-user-changed', handleUserChange as EventListener);
    };
  }, []);

  const setTestUser = () => {
    setCurrentUser('test_user');
    toast({
      title: "Utilisateur de test activé",
      description: "L'identifiant utilisateur a été défini sur 'test_user'"
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant={isValid ? "outline" : "destructive"} className="cursor-pointer">
              {isValid ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {isValid ? 'ID: ' + currentUser : 'ID par défaut'}
            </Badge>
            {!isValid && (
              <Button variant="ghost" size="sm" onClick={setTestUser} className="h-6 px-2">
                <UserCheck className="h-3 w-3 mr-1" />
                Définir test
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Identifiant utilisateur actuel: {currentUser}</p>
          {!isValid && (
            <p className="text-red-500">Utilisateur par défaut du système, aucune donnée personnalisée.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserIdChecker;
