
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  nom: string;
  lien: string | null;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  etat: string;
}

interface DocumentFormProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: Document) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ document, open, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Document>({
    id: document?.id || 0,
    nom: document?.nom || '',
    lien: document?.lien || null,
    responsabilites: document?.responsabilites || { r: [], a: [], c: [], i: [] },
    etat: document?.etat || 'NC'
  });

  React.useEffect(() => {
    if (document) {
      setFormData({
        id: document.id,
        nom: document.nom,
        lien: document.lien,
        responsabilites: document.responsabilites,
        etat: document.etat
      });
    }
  }, [document]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast({
      title: "Document sauvegardé",
      description: `Les modifications du document ${formData.id} ont été enregistrées`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">
                Nom
              </Label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lien" className="text-right">
                Lien
              </Label>
              <Input
                id="lien"
                name="lien"
                value={formData.lien || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="URL du document"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;
