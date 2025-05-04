
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResetSystemLinkProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ResetSystemLink: React.FC<ResetSystemLinkProps> = ({ 
  className = '',
  variant = 'destructive',
  size = 'default'
}) => {
  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      asChild
    >
      <Link to="/admin/reset-system">
        <AlertTriangle className="mr-2 h-4 w-4" />
        Réinitialisation du système
      </Link>
    </Button>
  );
};

export default ResetSystemLink;
