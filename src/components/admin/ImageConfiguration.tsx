
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from '@/config/apiConfig';
import { Button } from "@/components/ui/button";

const ImageConfiguration = () => {
  const { toast } = useToast();
  const [sidebarImageUrl, setSidebarImageUrl] = useState<string>('/lovable-uploads/swiss-army-knife-logo.png');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState<string>('');
  const [pdfLogo, setPdfLogo] = useState<string>('/lovable-uploads/formacert-logo.png');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const [sidebarImage, sidebarLink, pdfImage] = await Promise.all([
        fetchConfig('sidebarImageUrl'),
        fetchConfig('sidebarLinkUrl'),
        fetchConfig('pdfLogo')
      ]);

      if (sidebarImage) setSidebarImageUrl(sidebarImage);
      if (sidebarLink) setSidebarLinkUrl(sidebarLink);
      if (pdfImage) setPdfLogo(pdfImage);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async (key: string) => {
    const response = await fetch(`${getApiUrl()}/controllers/GlobalConfigController.php?key=${key}`);
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    return data.data?.value;
  };

  const saveConfig = async (key: string, value: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/controllers/GlobalConfigController.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) throw new Error('Erreur réseau');

      // Mettre à jour le localStorage pour une utilisation immédiate
      localStorage.setItem(key, value);

      toast({
        title: "Configuration sauvegardée",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'sidebar' | 'pdf') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (type === 'sidebar') {
          setSidebarImageUrl(base64String);
          await saveConfig('sidebarImageUrl', base64String);
        } else {
          setPdfLogo(base64String);
          await saveConfig('pdfLogo', base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSidebarLinkChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setSidebarLinkUrl(url);
    await saveConfig('sidebarLinkUrl', url);
  };

  const testPdfImage = () => {
    // Tester l'image en ouvrant une petite fenêtre avec l'image
    const win = window.open("", "_blank", "width=300,height=300");
    if (win) {
      win.document.write(`
        <html>
          <head><title>Test image PDF</title></head>
          <body>
            <h3>Image PDF actuelle:</h3>
            <img src="${pdfLogo}" style="max-width:100%; max-height:200px;" />
            <p>Cette image sera utilisée dans les documents PDF générés.</p>
          </body>
        </html>
      `);
    } else {
      toast({
        title: "Impossible d'ouvrir la fenêtre",
        description: "Veuillez autoriser les popups pour ce site.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Chargement des configurations...</div>;
  }

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
              onChange={(event) => handleImageChange(event, 'sidebar')}
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
              onChange={(event) => handleImageChange(event, 'pdf')}
            />
            <Button 
              variant="secondary" 
              className="mt-2" 
              onClick={testPdfImage}
            >
              Tester cette image
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Après avoir changé le logo, vous devrez peut-être vider le cache du navigateur ou vous déconnecter/reconnecter pour voir les changements dans les PDF générés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConfiguration;
