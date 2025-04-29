
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Info } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Succès
        </Badge>
      );
    case 'warning':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Info className="h-3 w-3 mr-1" />
          Avertissement
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Erreur
        </Badge>
      );
  }
};
