
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let icon = null;
  
  switch (status.toLowerCase()) {
    case 'success':
      variant = "default";
      icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
      break;
    case 'warning':
      variant = "secondary";
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
    case 'error':
      variant = "destructive";
      icon = <XCircle className="h-3 w-3 mr-1" />;
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </Badge>
  );
};
