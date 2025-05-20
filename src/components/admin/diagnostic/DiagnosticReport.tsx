
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { DiagnosticReport } from '@/services/diagnostic/DiagnosticService';

interface DiagnosticReportProps {
  report: DiagnosticReport | null;
}

export const DiagnosticReportView: React.FC<DiagnosticReportProps> = ({ report }) => {
  if (!report) return null;
  
  const { status, message, errors_found, recommendations } = report;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          Rapport de diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`p-4 rounded-md border ${getStatusColor()} mb-4`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <p className="font-medium">{message}</p>
          </div>
          {errors_found !== undefined && errors_found > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {errors_found} problème(s) détecté(s)
            </p>
          )}
        </div>
        
        {recommendations && recommendations.length > 0 && (
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Recommandations
            </AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
