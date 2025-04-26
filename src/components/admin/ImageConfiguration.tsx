
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const ImageConfiguration = () => {
  const { toast } = useToast();
  const [sidebarImageUrl, setSidebarImageUrl] = useState<string>('/lovable-uploads/swiss-army-knife-logo.png');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState<string>('');
  const [pdfLogo, setPdfLogo] = useState<string>('/lovable-uploads/formacert-logo.png');

  useEffect(() => {
    // Charger les images sauvegardées dans le localStorage
    const savedSidebarImage = localStorage.getItem('sidebarImageUrl');
    const savedSidebarLink = localStorage.getItem('sidebarLinkUrl');
    const savedPdfLogo = localStorage.getItem('pdfLogo');
    
    if (savedSidebarImage) setSidebarImageUrl(savedSidebarImage);
    if (savedSidebarLink) setSidebarLinkUrl(savedSidebarLink);
    if (savedPdfLogo) setPdfLogo(savedPdfLogo);
  }, []);

  // Fonction pour redimensionner l'image si elle est trop grande
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          // Si l'image est plus grande que les dimensions max, la redimensionner
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Impossible de créer un contexte canvas"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir à un format plus léger avec compression
          const quality = 0.85; // 85% de qualité
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Erreur lors de la conversion du canvas en blob"));
                return;
              }
              
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'sidebar' | 'pdf') => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Montrer un toast de chargement
        toast({
          title: "Traitement de l'image",
          description: "Veuillez patienter pendant que nous traitons votre image...",
        });
        
        // Redimensionner si nécessaire
        const maxWidth = 800; // px
        const maxHeight = 800; // px
        
        const base64String = await resizeImage(file, maxWidth, maxHeight);
        
        if (type === 'sidebar') {
          setSidebarImageUrl(base64String);
          localStorage.setItem('sidebarImageUrl', base64String);
        } else {
          setPdfLogo(base64String);
          localStorage.setItem('pdfLogo', base64String);
        }

        toast({
          title: "Image enregistrée",
          description: "L'image a été traitée et enregistrée avec succès.",
        });
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        toast({
          title: "Erreur",
          description: `Impossible de traiter l'image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSidebarLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setSidebarLinkUrl(url);
    localStorage.setItem('sidebarLinkUrl', url);
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
              onClick={testPdfImage}
              className="mt-2"
            >
              Tester cette image
            </Button>
            <div className="text-sm text-muted-foreground mt-2">
              <p>Les logos sont stockés localement dans votre navigateur. Pour les voir dans les PDF générés, assurez-vous de les configurer sur chaque appareil où vous utilisez l'application.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConfiguration;
