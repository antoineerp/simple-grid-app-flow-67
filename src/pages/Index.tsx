
import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { DemoButtons } from '@/components/auth/DemoButtons';
import { ApiStatus } from '@/components/auth/ApiStatus';
import { LogoSection } from '@/components/auth/LogoSection';
import { useForm } from "react-hook-form";

const Index = () => {
  const form = useForm();

  const handleFillTestData = (role: string) => {
    switch(role) {
      case 'admin':
        form.setValue('username', 'p71x6d_system');
        form.setValue('password', 'admin123');
        break;
      case 'manager':
        form.setValue('username', 'p71x6d_dupont');
        form.setValue('password', 'manager456');
        break;
      case 'user':
        form.setValue('username', 'p71x6d_martin');
        form.setValue('password', 'user789');
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:mr-8">
        <LogoSection />
        <ApiStatus />
        <LoginForm />
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-app-blue hover:underline">
            Mot de passe oublié?
          </a>
        </div>
        <DemoButtons onFillTestData={handleFillTestData} />
      </div>
    </div>
  );
};

export default Index;
