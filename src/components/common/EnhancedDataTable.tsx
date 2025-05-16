
import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: string;
  header: string | ReactNode;
  cell: (item: T, index: number) => ReactNode;
  className?: string;
  width?: string;
}

export interface EnhancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyState?: ReactNode;
  dragAndDrop?: {
    onDragStart?: (e: React.DragEvent<HTMLTableRowElement>, item: T, index: number) => void;
    onDragOver?: (e: React.DragEvent<HTMLTableRowElement>, item: T, index: number) => void;
    onDragLeave?: (e: React.DragEvent<HTMLTableRowElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLTableRowElement>, item: T, index: number) => void;
    onDragEnd?: (e: React.DragEvent<HTMLTableRowElement>) => void;
  };
  renderHeader?: () => ReactNode;
  renderCustomBody?: (data: T[]) => ReactNode;
  // Options supplémentaires pour une meilleure expérience utilisateur
  showBorders?: boolean;
  striped?: boolean;
  compact?: boolean;
}

/**
 * EnhancedDataTable - Un composant de table amélioré avec support pour le glisser-déposer, 
 * le rendu personnalisé et d'autres fonctionnalités.
 */
function EnhancedDataTable<T>({
  data,
  columns,
  className = "",
  onRowClick,
  isLoading = false,
  emptyState,
  dragAndDrop,
  renderHeader,
  renderCustomBody,
  showBorders = true,
  striped = false,
  compact = false,
}: EnhancedDataTableProps<T>) {
  // Afficher un indicateur de chargement si nécessaire
  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-app-blue mx-auto"></div>
        <p className="mt-4 text-gray-500">Chargement des données...</p>
      </div>
    );
  }

  // Afficher un état vide si nécessaire
  if (data.length === 0 && emptyState) {
    return <div className="w-full">{emptyState}</div>;
  }

  // Classes conditionnelles pour les options de style
  const tableClasses = [
    'bg-white rounded-md shadow overflow-hidden',
    showBorders ? 'border border-gray-200' : '',
    className
  ].filter(Boolean).join(' ');

  // Classes conditionnelles pour les lignes
  const getRowClasses = (index: number) => [
    'hover:bg-gray-50',
    onRowClick ? 'cursor-pointer' : '',
    striped && index % 2 === 1 ? 'bg-gray-50' : '',
    compact ? 'h-10' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={tableClasses}>
      <Table>
        {renderHeader ? (
          renderHeader()
        ) : (
          <TableHeader>
            <TableRow className="bg-app-light-blue">
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.className}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}

        {renderCustomBody ? (
          renderCustomBody(data)
        ) : (
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={`row-${index}`}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={getRowClasses(index)}
                draggable={!!dragAndDrop}
                onDragStart={dragAndDrop?.onDragStart ? (e) => dragAndDrop.onDragStart!(e, item, index) : undefined}
                onDragOver={dragAndDrop?.onDragOver ? (e) => dragAndDrop.onDragOver!(e, item, index) : undefined}
                onDragLeave={dragAndDrop?.onDragLeave}
                onDrop={dragAndDrop?.onDrop ? (e) => dragAndDrop.onDrop!(e, item, index) : undefined}
                onDragEnd={dragAndDrop?.onDragEnd}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={`${index}-${column.key}`} 
                    className={column.className}
                  >
                    {column.cell(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
}

export default EnhancedDataTable;
