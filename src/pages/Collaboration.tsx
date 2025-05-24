
import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Collaboration = () => {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Collaboration</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Espace de collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Cette page permet la collaboration entre les membres de l'équipe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Collaboration;
