
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserSettings from "@/components/admin/UserSettings";
import DatabaseConfig from "@/components/admin/DatabaseConfig";
import SystemStatus from "@/components/admin/SystemStatus";
import DatabaseDiagnostic from "@/components/admin/DatabaseDiagnostic";
import { Card } from "@/components/ui/card";
import AdminUserList from "@/components/admin/AdminUserList";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DatabaseSyncMonitor from "@/components/admin/DatabaseSyncMonitor";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({
    title: "",
    description: ""
  });

  const handleShowDialog = (title: string, description: string) => {
    setDialogContent({ title, description });
    setShowDialog(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <AdminUserList />
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <DatabaseConfig />
          <DatabaseDiagnostic />
          <DatabaseSyncMonitor />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemStatus />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="p-6">
            <UserSettings />
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog avec DialogDescription pour éviter les warnings */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
