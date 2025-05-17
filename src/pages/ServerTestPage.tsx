
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServerTest from '@/components/ServerTest';

const ServerTestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test de connexion au serveur</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerTest />
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerTestPage;
