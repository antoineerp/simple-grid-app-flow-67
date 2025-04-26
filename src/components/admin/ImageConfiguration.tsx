
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ImageConfiguration = () => {
  const { toast } = useToast();
  const [sidebarImageUrl, setSidebarImageUrl] = useState<string>(localStorage.getItem('sidebarImageUrl') || '/lovable-uploads/swiss-army-knife-logo.png');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState<string>(localStorage.getItem('sidebarLinkUrl') || '');
  const [pdfLogo, setPdfLogo] = useState<string>(localStorage.getItem('pdfLogo') || '/lovable-uploads/formacert-logo.png');

  const handleSidebarImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('sidebarImageUrl', base64String);
        setSidebarImageUrl(base64String);
        toast({
          title: "Image mise à jour",
          description: "L'image de la barre latérale a été mise à jour avec succès.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('pdfLogo', base64String);
        setPdfLogo(base64String);
        toast({
          title: "Logo PDF mis à jour",
          description: "Le logo pour les documents PDF a été mis à jour avec succès.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSidebarLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    localStorage.setItem('sidebarLinkUrl', url);
    setSidebarLinkUrl(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image de la barre latérale</CardTitle>
          <CardDescription>
            Personnalisez l'image qui apparaît sous le menu principal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sidebarImage">Image actuelle</Label>
            <div className="w-24 h-24 relative">
              <img 
                src={sidebarImageUrl} 
                alt="Logo sidebar" 
                className="w-full h-full object-contain"
              />
            </div>
            <Input
              id="sidebarImage"
              type="file"
              accept="image/*"
              onChange={handleSidebarImageChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sidebarLink">Lien associé à l'image</Label>
            <Input
              id="sidebarLink"
              type="url"
              placeholder="https://..."
              value={sidebarLinkUrl}
              onChange={handleSidebarLinkChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo pour les documents PDF</CardTitle>
          <CardDescription>
            Personnalisez le logo qui apparaîtra en haut à gauche des documents PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdfLogo">Logo actuel</Label>
            <div className="w-24 h-24 relative">
              <img 
                src={pdfLogo} 
                alt="Logo PDF" 
                className="w-full h-full object-contain"
              />
            </div>
            <Input
              id="pdfLogo"
              type="file"
              accept="image/*"
              onChange={handlePdfLogoChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConfiguration;
