
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestResult } from './types';

interface DatabaseTestAlertProps {
  testResult: TestResult | null;
}

const DatabaseTestAlert = ({ testResult }: DatabaseTestAlertProps) => {
  if (!testResult) return null;

  return (
    <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
      <AlertDescription>
        {testResult.message}
      </AlertDescription>
    </Alert>
  );
};

export default DatabaseTestAlert;
