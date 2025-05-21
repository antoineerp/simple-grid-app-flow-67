
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const UserSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres utilisateur</CardTitle>
        <CardDescription>Configurer les préférences et options du compte</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cette section est en cours de développement. Elle permettra de configurer les préférences 
          utilisateur, les notifications et les options d'affichage.
        </p>
      </CardContent>
    </Card>
  );
};

export default UserSettings;
