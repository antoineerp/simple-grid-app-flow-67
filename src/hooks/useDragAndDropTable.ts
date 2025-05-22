
import { useState } from 'react';

/**
 * Hook pour gérer le glisser-déposer dans les tables
 * Compatible avec tous les types de tables de l'application
 */
export function useDragAndDropTable<T>(
  items: T[], 
  onReorder: (startIndex: number, endIndex: number, targetGroupId?: string) => void,
  getItemGroupId?: (item: T) => string | undefined
) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemGroupId, setDraggedItemGroupId] = useState<string | undefined>(undefined);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number>(-1);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  // Gestionnaire pour le début du glisser-déposer
  const handleDragStart = (
    e: React.DragEvent<HTMLTableRowElement>, 
    id: string, 
    groupId?: string, 
    index?: number
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, groupId, index }));
    setDraggedItemId(id);
    setDraggedItemGroupId(groupId);
    setDraggedItemIndex(index !== undefined ? index : -1);
    e.currentTarget.classList.add('opacity-50');
  };
  
  // Gestionnaire pour le survol d'une cible potentielle
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    if (e.currentTarget.getAttribute('data-id') !== draggedItemId) {
      e.currentTarget.classList.add('bg-gray-100');
      setDropTargetId(e.currentTarget.getAttribute('data-id'));
    }
  };
  
  // Gestionnaire quand le curseur quitte la cible
  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('bg-gray-100');
    setDropTargetId(null);
  };
  
  // Gestionnaire pour le dépôt sur une cible
  const handleDrop = (
    e: React.DragEvent<HTMLTableRowElement>, 
    id: string, 
    groupId?: string
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Si on essaie de déposer sur le même élément, ne rien faire
      if (dragData.id === id) return;
      
      // Si on manipule un groupe et pas un élément, ne pas traiter ici
      if (dragData.isGroup) return;
      
      // Trouver les indices de départ et d'arrivée
      let startIndex = dragData.index;
      if (startIndex === -1 || startIndex === undefined) {
        // Si l'index n'était pas préalablement défini, chercher dans les items
        const filteredItems = draggedItemGroupId 
          ? items.filter(item => getItemGroupId && getItemGroupId(item) === draggedItemGroupId)
          : items.filter(item => getItemGroupId && !getItemGroupId(item));
        
        startIndex = filteredItems.findIndex((item: any) => 
          (item.id && item.id === draggedItemId) || 
          (item.id && item.id.toString() === draggedItemId));
      }
      
      // Trouver l'index de la cible
      let endIndex = -1;
      const targetItems = groupId 
        ? items.filter(item => getItemGroupId && getItemGroupId(item) === groupId)
        : items.filter(item => getItemGroupId && !getItemGroupId(item));
        
      endIndex = targetItems.findIndex((item: any) => 
        (item.id && item.id === id) || 
        (item.id && item.id.toString() === id));
      
      if (startIndex === -1 || endIndex === -1) {
        console.error("Indices invalides pour le réordonnancement", { startIndex, endIndex });
        return;
      }
      
      // Appeler la fonction de réordonnancement
      onReorder(startIndex, endIndex, groupId);
    } catch (error) {
      console.error("Erreur lors du traitement du glisser-déposer:", error);
    }
    
    setDraggedItemId(null);
    setDraggedItemGroupId(undefined);
    setDraggedItemIndex(-1);
    setDropTargetId(null);
  };
  
  // Gestionnaire pour la fin du glisser-déposer (que ce soit réussi ou annulé)
  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItemId(null);
    setDraggedItemGroupId(undefined);
    setDraggedItemIndex(-1);
    setDropTargetId(null);
  };
  
  // Gestionnaire pour le glisser-déposer entre groupes
  const handleGroupDrop = (e: React.DragEvent<HTMLTableRowElement>, targetGroupId: string) => {
    e.preventDefault();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Ne traiter que si c'est un élément (et pas un groupe) qu'on dépose
      if (!dragData.isGroup && dragData.id && dragData.id !== targetGroupId) {
        console.log(`Déplacement de l'élément ${dragData.id} vers le groupe ${targetGroupId}`);
        
        // Ici, intégrer la logique pour déplacer un élément vers un groupe
        // Cette implémentation dépendra de la structure des données
      }
    } catch (error) {
      console.error("Erreur lors du traitement du glisser-déposer de groupe:", error);
    }
  };
  
  return {
    draggedItemId,
    draggedItemGroupId,
    draggedItemIndex,
    dropTargetId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleGroupDrop
  };
}
