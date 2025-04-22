
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Steps, Step } from "@/components/ui/steps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DatabaseGuide = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Guide de configuration de la base de données</CardTitle>
        <CardDescription>Comment configurer correctement la connexion à la base de données Infomaniak</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Pour que l'application fonctionne correctement, vous devez configurer la connexion à votre base de données MySQL d'Infomaniak.
          </AlertDescription>
        </Alert>
        
        <Steps>
          <Step title="Accédez à votre espace client Infomaniak">
            <p className="text-sm text-muted-foreground">
              Connectez-vous à votre compte Infomaniak et accédez à l'hébergement web concerné.
            </p>
          </Step>
          
          <Step title="Récupérez les informations de votre base de données">
            <p className="text-sm text-muted-foreground">
              Dans la section MySQL, notez les informations suivantes :
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-2">
              <li><strong>Nom d'hôte</strong> (généralement sous la forme p71x6d.myd.infomaniak.com)</li>
              <li><strong>Nom de la base de données</strong> (généralement sous la forme p71x6d_nom)</li>
              <li><strong>Nom d'utilisateur</strong> (souvent identique au nom de la base de données)</li>
              <li><strong>Mot de passe</strong> (celui que vous avez défini lors de la création)</li>
            </ul>
          </Step>
          
          <Step title="Créez la table utilisateurs">
            <p className="text-sm text-muted-foreground">
              Deux options s'offrent à vous :
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-2">
              <li>
                <span className="font-medium">Automatique</span> : la table sera créée automatiquement lors de 
                la première connexion si vous avez configuré correctement les informations de connexion.
              </li>
              <li>
                <span className="font-medium">Manuel via phpMyAdmin</span> : vous pouvez créer manuellement la table
                en vous connectant à phpMyAdmin depuis votre espace client Infomaniak, puis en exécutant la requête SQL appropriée.
              </li>
            </ul>
          </Step>
          
          <Step title="Configurez le fichier de configuration">
            <p className="text-sm text-muted-foreground">
              Éditez le fichier <code>api/config/db_config.json</code> en renseignant les informations de connexion :
            </p>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md mt-2 text-xs overflow-x-auto">
{`{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_nom_de_votre_base",
    "username": "p71x6d_votre_utilisateur",
    "password": "votre_mot_de_passe"
}`}
            </pre>
          </Step>
        </Steps>
        
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention à la sécurité</AlertTitle>
          <AlertDescription>
            Ne partagez jamais vos informations d'identification à la base de données. 
            Assurez-vous que le fichier db_config.json n'est pas accessible publiquement.
          </AlertDescription>
        </Alert>
        
        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="sql">
            <AccordionTrigger>Structure SQL de la table utilisateurs</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS \`utilisateurs\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`nom\` varchar(100) NOT NULL,
  \`prenom\` varchar(100) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`mot_de_passe\` varchar(255) NOT NULL,
  \`identifiant_technique\` varchar(50) NOT NULL,
  \`role\` varchar(20) NOT NULL,
  \`date_creation\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`),
  UNIQUE KEY \`identifiant_technique\` (\`identifiant_technique\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DatabaseGuide;
