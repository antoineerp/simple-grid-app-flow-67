
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, LockKeyhole } from "lucide-react";

const DatabaseSecurityNote: React.FC = () => {
  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <div className="flex items-start">
        <Shield className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
        <div>
          <AlertTitle className="text-amber-800 font-medium">
            Note de sécurité importante
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            <p className="mb-2">
              Pour des raisons de sécurité, les mots de passe de base de données ne sont pas stockés 
              en clair dans les fichiers de configuration publiquement accessibles.
            </p>
            <p className="mb-2">
              Si vous modifiez la configuration de la base de données, assurez-vous de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Saisir directement le mot de passe sur le serveur de production</li>
              <li>Ne jamais exposer le mot de passe dans le code source ou les repositories</li>
              <li>Utiliser des méthodes sécurisées pour partager les identifiants</li>
            </ul>
            <div className="flex items-center mt-3 text-sm">
              <LockKeyhole className="h-4 w-4 mr-1 text-amber-600" />
              <span>La sécurité des données est une priorité absolue</span>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default DatabaseSecurityNote;
