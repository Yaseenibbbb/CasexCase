import React from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <SignInForm />
      </div>
    </div>
  );
}
