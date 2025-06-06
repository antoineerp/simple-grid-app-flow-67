
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Exigence } from '@/types/exigences';

interface ExigenceFormProps {
  exigence: Exigence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exigence: Exigence) => void;
}

const ExigenceForm: React.FC<ExigenceFormProps> = ({ exigence, open, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Exigence>({
    id: exigence?.id || '',
    nom: exigence?.nom || '',
    responsabilites: {
      r: [],
      a: [],
      c: [],
      i: []
    },
    exclusion: exigence?.exclusion || false,
    atteinte: exigence?.atteinte || null,
    date_creation: exigence?.date_creation || new Date(),
    date_modification: exigence?.date_modification || new Date()
  });

  useEffect(() => {
    if (exigence) {
      setFormData({
        ...exigence,
        responsabilites: exigence.responsabilites || {
          r: [],
          a: [],
          c: [],
          i: []
        }
      });
    }
  }, [exigence]);

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
      title: "Exigence sauvegardée",
      description: `Les modifications de l'exigence ${formData.id} ont été enregistrées`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier l'exigence</DialogTitle>
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
          </div>
          <DialogFooter>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExigenceForm;
