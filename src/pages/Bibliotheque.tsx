import React from 'react';
import { FileText, Pencil, Trash, ChevronDown, FolderPlus, GripVertical, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { exportBibliothecaireDocsToPdf } from '@/services/pdfExport';
import { useBibliotheque } from '@/hooks/useBibliotheque';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const Bibliotheque = () => {
  const { toast } = useToast();
  const {
    documents,
    groups,
    isDialogOpen,
    isGroupDialogOpen,
    isEditing,
    currentDocument,
    currentGroup,
    setIsDialogOpen,
    setIsGroupDialogOpen,
    handleEditDocument,
    handleDeleteDocument,
    handleAddDocument,
    handleDocumentInputChange,
    handleSaveDocument,
    handleEditGroup,
    handleDeleteGroup,
    handleAddGroup,
    handleGroupInputChange,
    handleSaveGroup,
    handleDrop,
    handleGroupDrop,
    toggleGroup,
    setDraggedItem,
  } = useBibliotheque();
  
  const handleExportPdf = () => {
    exportBibliothecaireDocsToPdf(documents, groups);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: string, groupId?: string) => {
    setDraggedItem({ id, groupId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-dashed', 'border-2', 'border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
  };

  const handleDocDrop = (e: React.DragEvent<HTMLTableRowElement>, targetId: string, targetGroupId?: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id: sourceId, groupId: sourceGroupId } = data;
      handleDrop(targetId, targetGroupId);
    } catch (error) {
      console.error("Erreur lors du drop:", error);
    }
    setDraggedItem(null);
  };

  const handleDocGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, targetGroupId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-dashed', 'border-2', 'border-primary');
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      handleGroupDrop(targetGroupId);
    } catch (error) {
      console.error("Erreur lors du drop du groupe:", error);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItem(null);
  };

  const renderDocumentLink = (link: string | null) => {
    if (!link || link === 'Voir le document') return <span className="text-gray-500">-</span>;
    
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-app-blue hover:underline inline-flex items-center gap-1"
      >
        {link}
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  };
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
          <p className="text-gray-600">Gestion des documents partagés</p>
        </div>
        <div>
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Nom du document</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold">Lien</TableHead>
              <TableHead className="py-3 px-4 text-app-blue font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                <TableRow 
                  className="border-b hover:bg-gray-50 cursor-pointer" 
                  onClick={() => toggleGroup(group.id)}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, group.id, undefined);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDragOver(e);
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    handleDragLeave(e);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDocGroupDrop(e, group.id);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    handleDragEnd(e);
                  }}
                >
                  <TableCell className="py-3 px-2 w-10">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </TableCell>
                  <TableCell 
                    className="py-3 px-4 w-full text-left" 
                  >
                    <div className="flex items-center">
                      <ChevronDown className={`h-4 w-4 mr-2 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                      <span className="font-medium">{group.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4"></TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <button 
                      className="text-gray-600 hover:text-app-blue mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroup(group);
                      }}
                    >
                      <Pencil className="h-5 w-5 inline-block" />
                    </button>
                    <button 
                      className="text-gray-600 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                    >
                      <Trash className="h-5 w-5 inline-block" />
                    </button>
                  </TableCell>
                </TableRow>
                
                {group.expanded && (
                  group.items.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="border-b hover:bg-gray-50 bg-gray-50"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, item.id, group.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragOver(e);
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        handleDragLeave(e);
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDocDrop(e, item.id, group.id);
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        handleDragEnd(e);
                      }}
                    >
                      <TableCell className="py-3 px-2 w-10">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                      </TableCell>
                      <TableCell className="py-3 px-4 pl-8">{item.name}</TableCell>
                      <TableCell className="py-3 px-4">
                        {renderDocumentLink(item.link)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <button 
                          className="text-gray-600 hover:text-app-blue mr-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDocument({...item, groupId: group.id});
                          }}
                        >
                          <Pencil className="h-5 w-5 inline-block" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(item.id);
                          }}
                        >
                          <Trash className="h-5 w-5 inline-block" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </React.Fragment>
            ))}
          </TableBody>
          <TableBody>
            {documents.map((doc) => (
              <TableRow 
                key={doc.id} 
                className="border-b hover:bg-gray-50"
                draggable
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDocDrop(e, doc.id)}
                onDragEnd={handleDragEnd}
              >
                <TableCell className="py-3 px-2 w-10">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </TableCell>
                <TableCell className="py-3 px-4">{doc.name}</TableCell>
                <TableCell className="py-3 px-4">
                  {renderDocumentLink(doc.link)}
                </TableCell>
                <TableCell className="py-3 px-4 text-right">
                  <button 
                    className="text-gray-600 hover:text-app-blue mr-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDocument(doc);
                    }}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                  >
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline"
          className="hover:bg-gray-100 transition-colors"
          onClick={handleAddGroup}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Nouveau groupe
        </Button>
        <Button 
          variant="default"
          onClick={handleAddDocument}
        >
          Nouveau document
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le document" : "Ajouter un document"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations du document ci-dessous." 
                : "Remplissez les informations pour ajouter un nouveau document."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                value={currentDocument.name}
                onChange={handleDocumentInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link" className="text-right">
                Lien
              </Label>
              <Input
                id="link"
                name="link"
                className="col-span-3"
                value={currentDocument.link || ''}
                onChange={handleDocumentInputChange}
                placeholder="Laisser vide si aucun lien"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDocument}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier le groupe" : "Ajouter un groupe"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations du groupe ci-dessous." 
                : "Remplissez les informations pour ajouter un nouveau groupe."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                value={currentGroup.name}
                onChange={handleGroupInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveGroup}>
              {isEditing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bibliotheque;
