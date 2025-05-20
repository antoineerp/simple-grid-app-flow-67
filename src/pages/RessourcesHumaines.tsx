
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import MemberList from '@/components/ressources-humaines/MemberList';

const RessourcesHumaines = () => {
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ressources Humaines</CardTitle>
            <CardDescription>Gérez les membres de votre équipe</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberList membres={[]} onEdit={() => {}} onDelete={() => {}} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RessourcesHumaines;
