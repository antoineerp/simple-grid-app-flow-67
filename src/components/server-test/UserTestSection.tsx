
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Users, Database, CheckCircle, AlertCircle } from "lucide-react";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

interface FallbackUser {
  identifiant_technique: string;
  mot_de_passe: string;
  role: string;
}

interface UserTestSectionProps {
  usersStatus: 'idle' | 'loading' | 'success' | 'error';
  usersMessage: string;
  users: User[];
  fallbackUsers: FallbackUser[];
  onTest: () => void;
}

const UserTestSection: React.FC<UserTestSectionProps> = ({
  usersStatus,
  usersMessage,
  users,
  fallbackUsers,
  onTest
}) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium flex items-center">
        <Users className="h-4 w-4 mr-2" />
        Utilisateurs disponibles:
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onTest}
        disabled={usersStatus === 'loading'}
      >
        {usersStatus === 'loading' ? 'Chargement...' : 'Vérifier'}
      </Button>
    </div>

    {usersStatus !== 'idle' && (
      <>
        <Alert variant={usersStatus === 'success' ? 'default' : 'destructive'} className="mt-2">
          <div className="flex items-start">
            {usersStatus === 'success'
              ? <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
              : <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />}
            <div>
              <AlertTitle>{usersStatus === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
              <AlertDescription>{usersMessage}</AlertDescription>
            </div>
          </div>
        </Alert>

        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="database-users">
            <AccordionTrigger>
              <span className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Utilisateurs de la base de données
                <Badge variant="outline" className="ml-2">{users.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {users.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {users.map((user, index) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <div className="flex justify-between">
                        <div className="font-medium">{user.identifiant_technique}</div>
                        <Badge>{user.role}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.prenom} {user.nom} ({user.email})
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucun utilisateur trouvé dans la base de données.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fallback-users">
            <AccordionTrigger>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Utilisateurs de secours
                <Badge variant="outline" className="ml-2">{fallbackUsers.length}</Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {fallbackUsers.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {fallbackUsers.map((user, index) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <div className="flex justify-between">
                        <div className="font-medium">{user.identifiant_technique}</div>
                        <Badge>{user.role}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Mot de passe: <code className="bg-background px-1 rounded">{user.mot_de_passe}</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucun utilisateur de secours disponible.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    )}
  </div>
);

export default UserTestSection;
